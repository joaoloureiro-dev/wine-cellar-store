import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/list-params";
import { db } from "@/lib/db";
import { isReference } from "@/lib/references";
import type { ReservationStatus } from "@/lib/reservations/status";

export async function listAdminReservations({
    status,
    q,
    page,
}: {
    status?: ReservationStatus;
    q?: string;
    page: number;
}) {
    const where: Prisma.ReservationWhereInput = {
        status,
        OR: q
            ? [
                  { reference: { contains: q, mode: "insensitive" } },
                  { customerEmail: { contains: q, mode: "insensitive" } },
                  { customerName: { contains: q, mode: "insensitive" } },
              ]
            : undefined,
    };

    const [reservations, total] = await Promise.all([
        db.reservation.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * ADMIN_PAGE_SIZE,
            take: ADMIN_PAGE_SIZE,
            select: {
                reference: true,
                status: true,
                quantity: true,
                customerName: true,
                customerEmail: true,
                createdAt: true,
                expiresAt: true,
                product: { select: { name: true } },
            },
        }),
        db.reservation.count({ where }),
    ]);

    return { reservations, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminReservation(reference: string) {
    if (!isReference(reference, "RSV")) {
        return null;
    }

    return db.reservation.findUnique({
        where: { reference },
        include: {
            product: {
                select: { id: true, name: true, sku: true, stockQuantity: true, stockStatus: true },
            },
            events: { orderBy: { createdAt: "desc" } },
            user: { select: { email: true } },
        },
    });
}
