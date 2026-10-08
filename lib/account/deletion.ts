import "server-only";

import { db } from "@/lib/db";

/** Orders still being paid, prepared or delivered. */
const OPEN_ORDER_STATUSES = ["AWAITING_PAYMENT", "PAID", "PROCESSING", "SHIPPED"] as const;
/** Reservations that may still hold stock or turn into a sale. */
const OPEN_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "AWAITING_PAYMENT"] as const;

export const REMOVED_CUSTOMER = { name: "Cliente removido", email: "removido@cellarium.invalid", phone: "" };

/** Error codes, translated for customers in lib/auth/messages.ts. */
export type DeletionBlocker = "ADMIN_ACCOUNT" | "OPEN_ORDERS" | "OPEN_RESERVATIONS";

/** Why the account cannot be deleted right now, or null. */
export async function getDeletionBlocker(userId: string): Promise<DeletionBlocker | null> {
    const [user, openOrders, openReservations] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { role: true } }),
        db.order.count({ where: { userId, status: { in: [...OPEN_ORDER_STATUSES] } } }),
        db.reservation.count({ where: { userId, status: { in: [...OPEN_RESERVATION_STATUSES] } } }),
    ]);

    if (user?.role === "ADMIN") return "ADMIN_ACCOUNT";
    if (openOrders > 0) return "OPEN_ORDERS";
    if (openReservations > 0) return "OPEN_RESERVATIONS";

    return null;
}

/**
 * Runs just before the user row is deleted (Better Auth deleteUser hook).
 *
 * - Addresses, favourites, sessions and sign-in methods are deleted with
 *   the user (ON DELETE CASCADE).
 * - Orders are kept but unlinked from the account: invoices must be kept
 *   for tax purposes (RGPD art. 17(3)(b)), so their billing and delivery
 *   details stay as placed.
 * - Finished reservations have no such obligation: their contact details
 *   are replaced before being unlinked.
 */
export async function anonymiseBeforeDeletion(userId: string) {
    await db.reservation.updateMany({
        where: { userId, status: { notIn: [...OPEN_RESERVATION_STATUSES] } },
        data: { customerName: REMOVED_CUSTOMER.name, customerEmail: REMOVED_CUSTOMER.email, customerPhone: REMOVED_CUSTOMER.phone, customerNotes: null },
    });
}
