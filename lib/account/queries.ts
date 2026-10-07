import "server-only";

import { db } from "@/lib/db";

/**
 * Account data access. Every query is scoped by userId taken from the
 * server-side session, never from the request, so customers can only ever
 * read their own records.
 */

export async function getUserOrders(userId: string, take?: number) {
    return db.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
        select: {
            reference: true,
            status: true,
            totalCents: true,
            paymentMethod: true,
            createdAt: true,
            items: { select: { productName: true, quantity: true } },
        },
    });
}

export async function getUserReservations(userId: string, take?: number) {
    return db.reservation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
        select: {
            reference: true,
            status: true,
            quantity: true,
            createdAt: true,
            product: { select: { name: true } },
        },
    });
}

export async function getUserAddresses(userId: string) {
    return db.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
}

export async function getDefaultAddress(userId: string) {
    return db.address.findFirst({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
}

export async function hasPasswordAccount(userId: string) {
    const account = await db.account.findFirst({
        where: { userId, providerId: "credential" },
        select: { id: true },
    });

    return Boolean(account);
}
