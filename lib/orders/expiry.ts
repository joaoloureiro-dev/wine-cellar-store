import "server-only";

import { invalidateCatalog } from "@/lib/catalog/cache";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { applyOrderTransition, OrderError } from "@/lib/orders/service";

const log = createLogger("orders.expiry");

/**
 * Expires unpaid orders past their payment deadline: each order moves to
 * EXPIRED (releasing its stock) and its pending payments are closed, in one
 * transaction per order. Orders paid concurrently are skipped safely thanks
 * to the compare-and-set transition.
 */
export async function expireOverdueOrders({ limit = 100 } = {}) {
    const overdue = await db.order.findMany({
        where: { status: "AWAITING_PAYMENT", paymentDueAt: { lt: new Date() } },
        select: { id: true, reference: true, items: { select: { productId: true } } },
        orderBy: { paymentDueAt: "asc" },
        take: limit,
    });

    let expired = 0;
    let skipped = 0;
    const productIds = new Set<string>();

    for (const order of overdue) {
        try {
            await db.$transaction(async (tx) => {
                await applyOrderTransition(tx, {
                    orderId: order.id,
                    to: "EXPIRED",
                    actor: "SYSTEM",
                    note: "Prazo de pagamento ultrapassado",
                });

                const pending = await tx.payment.findMany({
                    where: { orderId: order.id, status: "PENDING" },
                    select: { id: true },
                });

                for (const payment of pending) {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: "EXPIRED",
                            failureReason: "Order payment deadline passed",
                            events: { create: { type: "EXPIRED", message: "Order expired" } },
                        },
                    });
                }
            });

            expired += 1;
            order.items.forEach((item) => productIds.add(item.productId));
        } catch (error) {
            // e.g. paid between the query and the transition (CONFLICT).
            skipped += 1;
            log[error instanceof OrderError ? "info" : "error"]("Order not expired", {
                orderReference: order.reference,
                error,
            });
        }
    }

    if (productIds.size > 0) {
        invalidateCatalog();
    }

    log.info("Expiry run finished", { expired, skipped });

    return { expired, skipped };
}
