import "server-only";

import { invalidateCatalog } from "@/lib/catalog/cache";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { applyReservationTransition, ReservationError } from "@/lib/reservations/service";

const log = createLogger("reservations.expiry");

/**
 * Expires confirmed reservations past their deadline, releasing any stock
 * they hold. One transaction per reservation; a reservation changed
 * concurrently (e.g. marked as paid) is skipped by the compare-and-set.
 */
export async function expireOverdueReservations({ limit = 100 } = {}) {
    const overdue = await db.reservation.findMany({
        where: { status: { in: ["CONFIRMED", "AWAITING_PAYMENT"] }, expiresAt: { lt: new Date() } },
        select: { id: true, reference: true },
        orderBy: { expiresAt: "asc" },
        take: limit,
    });

    let expired = 0;
    let skipped = 0;
    const productIds = new Set<string>();

    for (const reservation of overdue) {
        try {
            const result = await db.$transaction((tx) =>
                applyReservationTransition(tx, {
                    reservationId: reservation.id,
                    to: "EXPIRED",
                    actor: "SYSTEM",
                    note: "Prazo da reserva ultrapassado",
                }),
            );

            expired += 1;
            if (result.stockChanged) productIds.add(result.productId);
        } catch (error) {
            skipped += 1;
            log[error instanceof ReservationError ? "info" : "error"]("Reservation not expired", {
                reservationReference: reservation.reference,
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
