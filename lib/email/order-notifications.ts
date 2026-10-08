import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { enqueueEmail } from "@/lib/email/outbox";
import { notifiedOrderStatuses, type NotifiedOrderStatus } from "@/lib/email/templates/orders";
import type { OrderStatus } from "@/lib/orders/status";

type OrderRef = { id: string; customerEmail: string };

/** Confirmation for the customer and an alert for the shop. */
export async function queueOrderPlacedEmails(tx: Prisma.TransactionClient, order: OrderRef) {
    await enqueueEmail(tx, { type: "order.received", to: order.customerEmail, payload: { orderId: order.id }, dedupeKey: `order:${order.id}:received` });

    if (env.ADMIN_NOTIFICATION_EMAIL) {
        await enqueueEmail(tx, { type: "admin.order", to: env.ADMIN_NOTIFICATION_EMAIL, payload: { orderId: order.id }, dedupeKey: `order:${order.id}:admin` });
    }
}

export async function queueOrderStatusEmail(tx: Prisma.TransactionClient, order: OrderRef, status: OrderStatus) {
    if (!(notifiedOrderStatuses as readonly string[]).includes(status)) return;

    await enqueueEmail(tx, {
        type: "order.status",
        to: order.customerEmail,
        payload: { orderId: order.id, status: status as NotifiedOrderStatus },
        dedupeKey: `order:${order.id}:${status}`,
    });
}
