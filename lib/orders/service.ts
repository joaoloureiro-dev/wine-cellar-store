import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { calculateShippingCents, getShippingMethod } from "@/lib/checkout/shipping";
import type { CheckoutInput } from "@/lib/checkout/schema";
import type { CartLine } from "@/lib/cart/schema";
import { db } from "@/lib/db";
import { canTransitionOrder, releasesStock, type OrderStatus } from "@/lib/orders/status";
import { releaseStock, reserveStock } from "@/lib/orders/stock";
import { generateReference, isReference } from "@/lib/references";

/**
 * ⚠️ PLACEHOLDER: payment window before an unpaid order expires and its
 * stock is released. To be aligned with the payment provider (Payments stage).
 */
const PAYMENT_WINDOW_HOURS = 48;
const REFERENCE_ATTEMPTS = 3;

export class OrderError extends Error {
    constructor(
        public readonly code:
            | "EMPTY_CART"
            | "INSUFFICIENT_STOCK"
            | "INVALID_SHIPPING"
            | "INVALID_TRANSITION"
            | "CONFLICT"
            | "NOT_FOUND",
        message: string,
    ) {
        super(message);
        this.name = "OrderError";
    }
}

function isUniqueViolation(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findOrderByIdempotencyKey(idempotencyKey: string) {
    return db.order.findUnique({ where: { idempotencyKey }, select: { reference: true } });
}

/**
 * Places an order in a single database transaction:
 *   1. holds stock for every line with an atomic conditional UPDATE,
 *   2. re-reads prices from the database (the client is never trusted),
 *   3. computes shipping and totals, and stores snapshots + an audit event.
 * Any failure rolls everything back, so stock is never held for an order
 * that does not exist. Re-submitting the same idempotency key returns the
 * existing order instead of creating a second one.
 */
export async function placeOrder(input: CheckoutInput, lines: CartLine[]) {
    const existing = await findOrderByIdempotencyKey(input.idempotencyKey);

    if (existing) {
        return existing;
    }

    if (lines.length === 0) {
        throw new OrderError("EMPTY_CART", "O seu carrinho está vazio.");
    }

    const shippingMethod = getShippingMethod(input.shippingMethod);

    if (!shippingMethod) {
        throw new OrderError("INVALID_SHIPPING", "Método de entrega inválido.");
    }

    // Lock rows in a consistent order to avoid deadlocks between orders.
    const sortedLines = [...lines].sort((a, b) => a.productId.localeCompare(b.productId));

    for (let attempt = 1; attempt <= REFERENCE_ATTEMPTS; attempt += 1) {
        try {
            return await db.$transaction(async (tx) => {
                const unavailable: string[] = [];

                for (const line of sortedLines) {
                    if (!(await reserveStock(tx, line.productId, line.quantity))) {
                        unavailable.push(line.productId);
                    }
                }

                const products = await tx.product.findMany({
                    where: { id: { in: sortedLines.map((line) => line.productId) } },
                    select: { id: true, name: true, sku: true, priceCents: true },
                });
                const productsById = new Map(products.map((product) => [product.id, product]));

                if (unavailable.length > 0) {
                    const names = unavailable.map(
                        (id) => productsById.get(id)?.name ?? "Produto indisponível",
                    );

                    throw new OrderError(
                        "INSUFFICIENT_STOCK",
                        `Sem stock suficiente para: ${names.join(", ")}. Reveja o carrinho.`,
                    );
                }

                const items = sortedLines.map((line) => {
                    const product = productsById.get(line.productId)!;

                    return {
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        unitPriceCents: product.priceCents,
                        quantity: line.quantity,
                        lineTotalCents: product.priceCents * line.quantity,
                    };
                });

                const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
                const shippingCents = calculateShippingCents(shippingMethod, subtotalCents);

                return tx.order.create({
                    data: {
                        reference: generateReference("ENC"),
                        idempotencyKey: input.idempotencyKey,
                        paymentMethod: input.paymentMethod,
                        subtotalCents,
                        shippingCents,
                        totalCents: subtotalCents + shippingCents,
                        shippingMethod: shippingMethod.id,
                        customerName: input.name,
                        customerEmail: input.email,
                        customerPhone: input.phone,
                        taxId: input.taxId,
                        addressLine1: input.addressLine1,
                        addressLine2: input.addressLine2,
                        postalCode: input.postalCode,
                        city: input.city,
                        customerNotes: input.customerNotes,
                        termsAcceptedAt: new Date(),
                        paymentDueAt: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
                        items: { create: items },
                        events: { create: { toStatus: "AWAITING_PAYMENT", actor: "CUSTOMER" } },
                    },
                    select: { reference: true },
                });
            });
        } catch (error) {
            if (!isUniqueViolation(error)) {
                throw error;
            }

            // A concurrent submit with the same idempotency key won the race.
            const duplicate = await findOrderByIdempotencyKey(input.idempotencyKey);

            if (duplicate) {
                return duplicate;
            }

            // Otherwise the (extremely unlikely) reference collided: retry.
            if (attempt === REFERENCE_ATTEMPTS) {
                throw error;
            }
        }
    }

    throw new Error("Could not generate a unique order reference.");
}

type OrderActor = "CUSTOMER" | "ADMIN" | "SYSTEM";

/**
 * Applies a status transition inside an existing transaction: lifecycle
 * check, compare-and-set update, stock release (cancel/expire) and audit
 * event. Lets other domains (payments) change an order atomically with
 * their own writes.
 */
export async function applyOrderTransition(
    tx: Prisma.TransactionClient,
    {
        orderId,
        to,
        actor,
        note,
    }: { orderId: string; to: OrderStatus; actor: OrderActor; note?: string },
) {
    const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            status: true,
            items: { select: { productId: true, quantity: true } },
        },
    });

    if (!order) {
        throw new OrderError("NOT_FOUND", "Encomenda não encontrada.");
    }

    if (!canTransitionOrder(order.status, to)) {
        throw new OrderError(
            "INVALID_TRANSITION",
            `Não é possível passar de ${order.status} para ${to}.`,
        );
    }

    const { count } = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: to },
    });

    if (count === 0) {
        throw new OrderError(
            "CONFLICT",
            "A encomenda foi alterada entretanto. Atualize e tente novamente.",
        );
    }

    if (releasesStock(to)) {
        for (const item of order.items) {
            await releaseStock(tx, item.productId, item.quantity);
        }
    }

    await tx.orderEvent.create({
        data: { orderId: order.id, fromStatus: order.status, toStatus: to, actor, note },
    });
}

/** Moves an order to a new status in its own transaction. */
export async function transitionOrderStatus({
    reference,
    to,
    actor,
    note,
}: {
    reference: string;
    to: OrderStatus;
    actor: OrderActor;
    note?: string;
}) {
    return db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { reference }, select: { id: true } });

        if (!order) {
            throw new OrderError("NOT_FOUND", "Encomenda não encontrada.");
        }

        await applyOrderTransition(tx, { orderId: order.id, to, actor, note });
    });
}

/** Public order summary for the confirmation page: no personal data. */
export async function getPublicOrder(reference: string) {
    if (!isReference(reference, "ENC")) {
        return null;
    }

    return db.order.findUnique({
        where: { reference },
        select: {
            reference: true,
            status: true,
            paymentMethod: true,
            subtotalCents: true,
            shippingCents: true,
            totalCents: true,
            paymentDueAt: true,
            createdAt: true,
            items: {
                select: {
                    productName: true,
                    quantity: true,
                    unitPriceCents: true,
                    lineTotalCents: true,
                    product: {
                        select: {
                            slug: true,
                            brand: { select: { name: true, slug: true } },
                            images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
                        },
                    },
                },
            },
        },
    });
}
