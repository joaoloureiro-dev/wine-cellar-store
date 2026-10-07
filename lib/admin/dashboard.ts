import "server-only";

import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Figures and short lists for the backoffice overview. */
export async function getDashboard() {
    const since = new Date(Date.now() - 30 * DAY_MS);

    const [
        awaitingPayment,
        awaitingTransfer,
        toFulfil,
        pendingReservations,
        revenue,
        recentOrders,
        stockAlerts,
    ] = await Promise.all([
        db.order.count({ where: { status: "AWAITING_PAYMENT" } }),
        db.order.count({ where: { status: "AWAITING_PAYMENT", paymentMethod: "BANK_TRANSFER" } }),
        db.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
        db.reservation.count({ where: { status: "PENDING" } }),
        db.payment.aggregate({
            where: { status: "PAID", paidAt: { gte: since } },
            _sum: { amountCents: true },
            _count: true,
        }),
        db.order.findMany({
            orderBy: { createdAt: "desc" },
            take: 6,
            select: {
                reference: true,
                status: true,
                paymentMethod: true,
                totalCents: true,
                customerName: true,
                createdAt: true,
            },
        }),
        db.product.findMany({
            where: { active: true, stockStatus: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } },
            orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
            take: 6,
            select: { id: true, name: true, sku: true, stockQuantity: true, stockStatus: true },
        }),
    ]);

    return {
        awaitingPayment,
        awaitingTransfer,
        toFulfil,
        pendingReservations,
        revenueCents: revenue._sum.amountCents ?? 0,
        paidCount: revenue._count,
        recentOrders,
        stockAlerts,
    };
}
