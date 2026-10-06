import "server-only";

import { Prisma, type PaymentProvider } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { applyOrderTransition } from "@/lib/orders/service";
import { getBankTransferDetails, getLocalProvider } from "@/lib/payments/config";
import { createKlarnaCheckout } from "@/lib/payments/providers/klarna";
import { PaymentProviderError } from "@/lib/payments/providers/types";

const log = createLogger("payments");

const DAY_MS = 24 * 60 * 60 * 1000;

export type InitiatePaymentResult =
    | { ok: true; checkoutUrl?: string }
    | { ok: false; message: string };

function sanitizeForAudit(data: unknown) {
    return JSON.parse(JSON.stringify(data ?? null)) as Prisma.InputJsonValue;
}

/**
 * Starts (or reuses) a payment attempt for an order awaiting payment.
 *
 * The attempt is stored before calling the provider, so every request is
 * auditable even if the provider call fails. Calling it again while a
 * pending attempt is still valid returns that attempt (idempotent), so a
 * refresh or double click never sends a second MB WAY request.
 */
export async function initiatePayment(orderReference: string): Promise<InitiatePaymentResult> {
    const order = await db.order.findUnique({
        where: { reference: orderReference },
        select: {
            id: true,
            reference: true,
            status: true,
            paymentMethod: true,
            totalCents: true,
            shippingCents: true,
            customerEmail: true,
            customerPhone: true,
            paymentDueAt: true,
            items: { select: { productName: true, unitPriceCents: true, quantity: true } },
            payments: {
                where: { status: "PENDING" },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    if (!order || order.status !== "AWAITING_PAYMENT") {
        return { ok: false, message: "Esta encomenda já não aguarda pagamento." };
    }

    const pending = order.payments[0];

    if (pending && (!pending.expiresAt || pending.expiresAt > new Date())) {
        return { ok: true, checkoutUrl: pending.checkoutUrl ?? undefined };
    }

    const method = order.paymentMethod;
    const local = getLocalProvider();
    const provider: PaymentProvider =
        method === "KLARNA" ? "STRIPE" : method === "BANK_TRANSFER" ? "MANUAL" : local.id;
    const description = `Encomenda ${order.reference}`;

    const payment = await db.payment.create({
        data: {
            orderId: order.id,
            provider,
            method,
            amountCents: order.totalCents,
            events: { create: { type: "CREATED" } },
        },
    });

    try {
        let update: Prisma.PaymentUpdateInput;

        switch (method) {
            case "MBWAY": {
                const result = await local.createMbWayPayment({
                    orderReference: order.reference,
                    amountCents: order.totalCents,
                    phone: order.customerPhone,
                    description,
                });
                update = { providerReference: result.providerReference, expiresAt: result.expiresAt };
                break;
            }
            case "MULTIBANCO": {
                const expiryDays = Math.max(
                    1,
                    Math.ceil((order.paymentDueAt.getTime() - Date.now()) / DAY_MS),
                );
                const result = await local.createMultibancoReference({
                    orderReference: order.reference,
                    amountCents: order.totalCents,
                    description,
                    expiryDays,
                });
                update = {
                    providerReference: result.providerReference,
                    mbEntity: result.entity,
                    mbReference: result.reference,
                    expiresAt: result.expiresAt ?? order.paymentDueAt,
                };
                break;
            }
            case "BANK_TRANSFER": {
                if (!getBankTransferDetails()) {
                    throw new PaymentProviderError("manual", "Bank transfer is not configured");
                }
                update = { expiresAt: order.paymentDueAt };
                break;
            }
            case "KLARNA": {
                const result = await createKlarnaCheckout({
                    paymentId: payment.id,
                    orderReference: order.reference,
                    email: order.customerEmail,
                    items: order.items.map((item) => ({
                        name: item.productName,
                        unitPriceCents: item.unitPriceCents,
                        quantity: item.quantity,
                    })),
                    shippingCents: order.shippingCents,
                });
                update = {
                    providerReference: result.providerReference,
                    checkoutUrl: result.checkoutUrl,
                    expiresAt: result.expiresAt,
                };
                break;
            }
        }

        const saved = await db.payment.update({
            where: { id: payment.id },
            data: { ...update, events: { create: { type: "REQUESTED" } } },
        });

        log.info("Payment requested", {
            paymentId: payment.id,
            orderReference: order.reference,
            provider,
            method,
        });

        return { ok: true, checkoutUrl: saved.checkoutUrl ?? undefined };
    } catch (error) {
        const reason =
            error instanceof PaymentProviderError ? error.message : "Unexpected provider error";

        await db.payment.update({
            where: { id: payment.id },
            data: {
                status: "FAILED",
                failureReason: reason,
                events: {
                    create: {
                        type: "REQUEST_FAILED",
                        message: reason,
                        data: error instanceof PaymentProviderError ? sanitizeForAudit(error.details) : undefined,
                    },
                },
            },
        });

        log.error("Payment request failed", {
            paymentId: payment.id,
            orderReference: order.reference,
            provider,
            method,
            error,
        });

        return {
            ok: false,
            message:
                method === "MBWAY"
                    ? "Não foi possível enviar o pedido MB WAY. Verifique o número e tente novamente."
                    : "Não foi possível gerar o pagamento neste momento. Tente novamente dentro de instantes.",
        };
    }
}

export type WebhookOutcome =
    | "paid"
    | "failed"
    | "duplicate"
    | "not_found"
    | "amount_mismatch"
    | "ignored";

type ProviderEvent = {
    provider: PaymentProvider;
    /** Unique id of this provider event, for idempotent processing. */
    externalId: string;
    orderReference?: string;
    providerReference?: string;
    payload: unknown;
};

function isUniqueViolation(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Records a provider event exactly once and runs `handler` in the same
 * transaction. Re-deliveries of a processed event are acknowledged as
 * duplicates without side effects.
 */
async function processOnce(
    event: ProviderEvent,
    handler: (tx: Prisma.TransactionClient) => Promise<WebhookOutcome>,
): Promise<WebhookOutcome> {
    try {
        return await db.$transaction(async (tx) => {
            const existing = await tx.webhookDelivery.findUnique({
                where: {
                    provider_externalId: { provider: event.provider, externalId: event.externalId },
                },
                select: { processedAt: true },
            });

            if (existing?.processedAt) {
                return "duplicate";
            }

            const outcome = await handler(tx);
            // Only final outcomes close the event. A rejected delivery (wrong
            // amount, unknown payment) is kept for auditing but must never
            // block a later, legitimate delivery with the same id.
            const isFinal = outcome === "paid" || outcome === "failed" || outcome === "ignored";
            const result = {
                payload: sanitizeForAudit(event.payload),
                processedAt: isFinal ? new Date() : null,
                error: isFinal ? null : outcome,
            };

            await tx.webhookDelivery.upsert({
                where: {
                    provider_externalId: { provider: event.provider, externalId: event.externalId },
                },
                create: { provider: event.provider, externalId: event.externalId, ...result },
                update: result,
            });

            return outcome;
        });
    } catch (error) {
        // A concurrent delivery of the same event may have won the race.
        // Any other conflict is rethrown so the provider retries and it is logged.
        if (isUniqueViolation(error)) {
            const delivery = await db.webhookDelivery.findUnique({
                where: {
                    provider_externalId: { provider: event.provider, externalId: event.externalId },
                },
                select: { processedAt: true },
            });

            if (delivery?.processedAt) {
                return "duplicate";
            }
        }

        throw error;
    }
}

async function findPayment(tx: Prisma.TransactionClient, event: ProviderEvent) {
    if (event.providerReference) {
        const byReference = await tx.payment.findUnique({
            where: {
                provider_providerReference: {
                    provider: event.provider,
                    providerReference: event.providerReference,
                },
            },
            include: { order: { select: { id: true, reference: true, status: true } } },
        });

        if (byReference) {
            return byReference;
        }
    }

    if (!event.orderReference) {
        return null;
    }

    // e.g. eupago Multibanco has no transaction id until it is paid.
    return tx.payment.findFirst({
        where: { provider: event.provider, order: { reference: event.orderReference } },
        orderBy: { createdAt: "desc" },
        include: { order: { select: { id: true, reference: true, status: true } } },
    });
}

/**
 * Marks a payment as PAID after a verified provider confirmation and, in
 * the same transaction, moves the order to PAID. The amount must match the
 * stored amount exactly; anything unusual is logged for manual review.
 */
export async function confirmPayment(
    event: ProviderEvent & { amountCents: number },
): Promise<WebhookOutcome> {
    const outcome = await processOnce(event, async (tx) => {
        const payment = await findPayment(tx, event);

        if (!payment) {
            return "not_found";
        }

        if (payment.status === "PAID") {
            return "duplicate";
        }

        if (event.amountCents !== payment.amountCents) {
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: "AMOUNT_MISMATCH",
                    message: `Expected ${payment.amountCents}, received ${event.amountCents}`,
                },
            });
            return "amount_mismatch";
        }

        const alreadyPaid = await tx.payment.findFirst({
            where: { orderId: payment.orderId, status: "PAID" },
            select: { id: true },
        });

        if (alreadyPaid) {
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: "DUPLICATE_PAYMENT_REVIEW",
                    message: "Order already paid by another attempt: refund required.",
                },
            });
            return "ignored";
        }

        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: "PAID",
                paidAt: new Date(),
                providerReference: payment.providerReference ?? event.providerReference,
                events: { create: { type: "PAID", data: sanitizeForAudit(event.payload) } },
            },
        });

        if (payment.order.status === "AWAITING_PAYMENT") {
            await applyOrderTransition(tx, {
                orderId: payment.orderId,
                to: "PAID",
                actor: "SYSTEM",
                note: `Pagamento confirmado (${event.provider})`,
            });
        } else if (payment.order.status !== "PAID") {
            // Paid after the order expired or was cancelled: stock may be gone.
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: "PAID_AFTER_ORDER_CLOSED",
                    message: `Order is ${payment.order.status}: review stock or refund.`,
                },
            });
        }

        return "paid";
    });

    log[outcome === "paid" || outcome === "duplicate" ? "info" : "warn"]("Payment confirmation", {
        provider: event.provider,
        externalId: event.externalId,
        orderReference: event.orderReference,
        outcome,
    });

    return outcome;
}

/** Marks a pending payment as FAILED/EXPIRED/CANCELLED after a provider event. */
export async function failPayment(
    event: ProviderEvent & { status: "FAILED" | "EXPIRED" | "CANCELLED"; reason: string },
): Promise<WebhookOutcome> {
    const outcome = await processOnce(event, async (tx) => {
        const payment = await findPayment(tx, event);

        if (!payment) {
            return "not_found";
        }

        const { count } = await tx.payment.updateMany({
            where: { id: payment.id, status: "PENDING" },
            data: { status: event.status, failureReason: event.reason },
        });

        if (count === 0) {
            return "ignored";
        }

        await tx.paymentEvent.create({
            data: { paymentId: payment.id, type: event.status, message: event.reason },
        });

        return "failed";
    });

    log.info("Payment failure event", {
        provider: event.provider,
        externalId: event.externalId,
        outcome,
    });

    return outcome;
}

/** Public payment view for the order page and status polling (no PII). */
export async function getOrderPaymentView(orderReference: string) {
    const order = await db.order.findUnique({
        where: { reference: orderReference },
        select: {
            status: true,
            paymentMethod: true,
            totalCents: true,
            paymentDueAt: true,
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    status: true,
                    mbEntity: true,
                    mbReference: true,
                    checkoutUrl: true,
                    expiresAt: true,
                    failureReason: true,
                },
            },
        },
    });

    if (!order) {
        return null;
    }

    const payment = order.payments[0] ?? null;
    const isPendingExpired =
        payment?.status === "PENDING" && payment.expiresAt !== null && payment.expiresAt < new Date();

    return {
        orderStatus: order.status,
        method: order.paymentMethod,
        totalCents: order.totalCents,
        paymentDueAt: order.paymentDueAt,
        payment: payment
            ? { ...payment, status: isPendingExpired ? ("EXPIRED" as const) : payment.status }
            : null,
    };
}

/** Used by webhooks to decide how to double-check a provider notification. */
export async function getPaymentMethodByReference(
    provider: PaymentProvider,
    providerReference: string,
) {
    const payment = await db.payment.findUnique({
        where: { provider_providerReference: { provider, providerReference } },
        select: { method: true },
    });

    return payment?.method ?? null;
}
