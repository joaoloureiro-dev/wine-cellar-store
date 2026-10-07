import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { db } from "@/lib/db";
import { applyOrderTransition, OrderError } from "@/lib/orders/service";
import type { OrderStatus } from "@/lib/orders/status";

/** Statuses an admin may move an order to by hand (PAID comes from payments). */
export const adminOrderTargets = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type AdminOrderTarget = (typeof adminOrderTargets)[number];

function isUniqueViolation(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Moves an order through its lifecycle on behalf of an admin. Cancelling
 * also closes pending payment attempts so a late payment is flagged for
 * review instead of silently reopening the order.
 *
 * @returns the product ids whose stock changed (for page revalidation).
 */
export async function adminTransitionOrder(
    admin: Admin,
    { reference, to, note }: { reference: string; to: AdminOrderTarget; note?: string },
) {
    return db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { reference },
            select: { id: true, status: true, items: { select: { productId: true } } },
        });

        if (!order) {
            throw new OrderError("NOT_FOUND", "Encomenda não encontrada.");
        }

        await applyOrderTransition(tx, {
            orderId: order.id,
            to,
            actor: "ADMIN",
            note: note || undefined,
        });

        if (to === "CANCELLED") {
            const pending = await tx.payment.findMany({
                where: { orderId: order.id, status: "PENDING" },
                select: { id: true },
            });

            for (const payment of pending) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: "CANCELLED",
                        failureReason: "Encomenda cancelada no backoffice",
                        events: { create: { type: "CANCELLED", message: "Order cancelled by admin" } },
                    },
                });
            }
        }

        await recordAudit(tx, admin, {
            action: "order.transition",
            entityType: "order",
            entityId: order.id,
            data: { reference, from: order.status, to, note: note ?? null },
        });

        return to === "CANCELLED" ? order.items.map((item) => item.productId) : [];
    });
}

/**
 * Records a bank transfer that was reconciled against the bank statement:
 * marks the manual payment as PAID and the order as PAID, atomically.
 * Safe against double submission: the order transition is compare-and-set
 * and the database allows only one PAID payment per order.
 */
export async function confirmBankTransfer(
    admin: Admin,
    { reference, note }: { reference: string; note?: string },
) {
    try {
        await db.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { reference },
                select: {
                    id: true,
                    status: true,
                    paymentMethod: true,
                    totalCents: true,
                    payments: {
                        where: { provider: "MANUAL", status: "PENDING" },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { id: true },
                    },
                },
            });

            if (!order) {
                throw new OrderError("NOT_FOUND", "Encomenda não encontrada.");
            }

            if (order.paymentMethod !== "BANK_TRANSFER") {
                throw new OrderError(
                    "INVALID_TRANSITION",
                    "Só pagamentos por transferência bancária são confirmados manualmente.",
                );
            }

            if (order.status !== ("AWAITING_PAYMENT" satisfies OrderStatus)) {
                throw new OrderError("CONFLICT", "Esta encomenda já não aguarda pagamento.");
            }

            // The bank movement reference is free text, so it is kept in the
            // event (providerReference is unique per provider).
            const paidEvent = {
                type: "PAID",
                message: `Transferência confirmada por ${admin.email}${note ? ` · ref. ${note}` : ""}`,
                data: note ? { note } : undefined,
            };
            const existing = order.payments[0];

            if (existing) {
                const { count } = await tx.payment.updateMany({
                    where: { id: existing.id, status: "PENDING" },
                    data: { status: "PAID", paidAt: new Date() },
                });

                if (count === 0) {
                    throw new OrderError("CONFLICT", "O pagamento foi alterado entretanto. Atualize a página.");
                }

                await tx.paymentEvent.create({ data: { paymentId: existing.id, ...paidEvent } });
            } else {
                // The original attempt expired or was never created: record it now.
                await tx.payment.create({
                    data: {
                        orderId: order.id,
                        provider: "MANUAL",
                        method: "BANK_TRANSFER",
                        amountCents: order.totalCents,
                        status: "PAID",
                        paidAt: new Date(),
                        events: { create: [{ type: "CREATED" }, paidEvent] },
                    },
                });
            }

            await applyOrderTransition(tx, {
                orderId: order.id,
                to: "PAID",
                actor: "ADMIN",
                note: "Transferência bancária confirmada",
            });

            await recordAudit(tx, admin, {
                action: "payment.confirm_manual",
                entityType: "order",
                entityId: order.id,
                data: { reference, amountCents: order.totalCents, note: note ?? null },
            });
        });
    } catch (error) {
        // Only Payment_one_paid_per_order_key can clash here.
        if (isUniqueViolation(error)) {
            throw new OrderError("CONFLICT", "Esta encomenda já tem um pagamento confirmado.");
        }

        throw error;
    }
}
