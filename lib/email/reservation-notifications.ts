import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { enqueueEmail } from "@/lib/email/outbox";
import { notifiedReservationStatuses, type NotifiedReservationStatus } from "@/lib/email/templates/reservations";
import type { ReservationStatus } from "@/lib/reservations/status";

type ReservationRef = { id: string; customerEmail: string };

export async function queueReservationCreatedEmails(tx: Prisma.TransactionClient, reservation: ReservationRef) {
    await enqueueEmail(tx, {
        type: "reservation.received",
        to: reservation.customerEmail,
        payload: { reservationId: reservation.id },
        dedupeKey: `reservation:${reservation.id}:received`,
    });

    if (env.ADMIN_NOTIFICATION_EMAIL) {
        await enqueueEmail(tx, {
            type: "admin.reservation",
            to: env.ADMIN_NOTIFICATION_EMAIL,
            payload: { reservationId: reservation.id },
            dedupeKey: `reservation:${reservation.id}:admin`,
        });
    }
}

export async function queueReservationStatusEmail(tx: Prisma.TransactionClient, reservation: ReservationRef, status: ReservationStatus) {
    if (!(notifiedReservationStatuses as readonly string[]).includes(status)) return;

    await enqueueEmail(tx, {
        type: "reservation.status",
        to: reservation.customerEmail,
        payload: { reservationId: reservation.id, status: status as NotifiedReservationStatus },
        dedupeKey: `reservation:${reservation.id}:${status}`,
    });
}
