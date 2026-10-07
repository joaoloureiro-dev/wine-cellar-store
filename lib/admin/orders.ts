import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/list-params";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/orders/status";
import { isReference } from "@/lib/references";

export async function listAdminOrders({
    status,
    q,
    page,
}: {
    status?: OrderStatus;
    q?: string;
    page: number;
}) {
    const where: Prisma.OrderWhereInput = {
        status,
        OR: q
            ? [
                  { reference: { contains: q, mode: "insensitive" } },
                  { customerEmail: { contains: q, mode: "insensitive" } },
                  { customerName: { contains: q, mode: "insensitive" } },
              ]
            : undefined,
    };

    const [orders, total] = await Promise.all([
        db.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * ADMIN_PAGE_SIZE,
            take: ADMIN_PAGE_SIZE,
            select: {
                reference: true,
                status: true,
                paymentMethod: true,
                totalCents: true,
                customerName: true,
                customerEmail: true,
                createdAt: true,
                _count: { select: { items: true } },
            },
        }),
        db.order.count({ where }),
    ]);

    return { orders, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminOrder(reference: string) {
    if (!isReference(reference, "ENC")) {
        return null;
    }

    return db.order.findUnique({
        where: { reference },
        include: {
            items: { orderBy: { productName: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
            payments: {
                orderBy: { createdAt: "desc" },
                include: { events: { orderBy: { createdAt: "desc" } } },
            },
            user: { select: { email: true } },
        },
    });
}

export async function getOrderAuditLog(orderId: string) {
    return db.adminAuditLog.findMany({
        where: { entityType: "order", entityId: orderId },
        orderBy: { createdAt: "desc" },
        select: { id: true, action: true, actorEmail: true, createdAt: true },
    });
}
