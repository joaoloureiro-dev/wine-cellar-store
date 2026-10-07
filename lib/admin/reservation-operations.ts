import "server-only";

import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { db } from "@/lib/db";
import { applyReservationTransition, ReservationError } from "@/lib/reservations/service";

export const adminReservationTargets = ["CONFIRMED", "AWAITING_PAYMENT", "PAID", "CANCELLED"] as const;
export type AdminReservationTarget = (typeof adminReservationTargets)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export async function adminTransitionReservation(
    admin: Admin,
    {
        reference,
        to,
        note,
        holdDays,
    }: { reference: string; to: AdminReservationTarget; note?: string; holdDays?: number },
) {
    return db.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
            where: { reference },
            select: { id: true, status: true },
        });

        if (!reservation) {
            throw new ReservationError("NOT_FOUND", "Reserva não encontrada.");
        }

        const expiresAt = to === "CONFIRMED" && holdDays ? new Date(Date.now() + holdDays * DAY_MS) : undefined;

        const result = await applyReservationTransition(tx, {
            reservationId: reservation.id,
            to,
            actor: "ADMIN",
            note: note || undefined,
            expiresAt,
        });

        await recordAudit(tx, admin, {
            action: "reservation.transition",
            entityType: "reservation",
            entityId: reservation.id,
            data: {
                reference,
                from: reservation.status,
                to,
                note: note ?? null,
                expiresAt: expiresAt?.toISOString() ?? null,
                stockHeld: result.stockHeld,
            },
        });

        return result;
    });
}

export async function updateReservationNotes(admin: Admin, { reference, notes }: { reference: string; notes: string }) {
    return db.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({ where: { reference }, select: { id: true } });

        if (!reservation) {
            throw new ReservationError("NOT_FOUND", "Reserva não encontrada.");
        }

        await tx.reservation.update({
            where: { id: reservation.id },
            data: { internalNotes: notes || null },
        });

        await recordAudit(tx, admin, {
            action: "reservation.notes",
            entityType: "reservation",
            entityId: reservation.id,
            data: { reference },
        });
    });
}
