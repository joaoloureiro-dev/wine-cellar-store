import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { releaseStock, reserveStock } from "@/lib/orders/stock";
import { generateReference, isReference } from "@/lib/references";
import type { CreateReservationInput } from "@/lib/reservations/schema";
import {
    canTransition,
    openReservationStatuses,
    type ReservationStatus,
} from "@/lib/reservations/status";

/** Abuse limit: reservations per email address in a rolling 24h window. */
const MAX_RESERVATIONS_PER_EMAIL_PER_DAY = 5;
const REFERENCE_ATTEMPTS = 3;

export class ReservationError extends Error {
    constructor(
        public readonly code:
            | "PRODUCT_UNAVAILABLE"
            | "DUPLICATE"
            | "RATE_LIMITED"
            | "INVALID_TRANSITION"
            | "CONFLICT"
            | "NOT_FOUND",
        message: string,
    ) {
        super(message);
        this.name = "ReservationError";
    }
}

function isUniqueViolation(error: unknown) {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
}

/**
 * Creates a PENDING reservation and its first audit event atomically.
 * Stock is not decremented here: units are held when the store confirms.
 */
export async function createReservation(
    input: CreateReservationInput,
    { userId }: { userId?: string } = {},
) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (let attempt = 1; attempt <= REFERENCE_ATTEMPTS; attempt += 1) {
        try {
            return await db.$transaction(async (tx) => {
                const product = await tx.product.findFirst({
                    where: { id: input.productId, active: true },
                    select: { id: true, priceCents: true },
                });

                if (!product) {
                    throw new ReservationError(
                        "PRODUCT_UNAVAILABLE",
                        "Este produto já não está disponível para reserva.",
                    );
                }

                const [recentCount, openDuplicate] = await Promise.all([
                    tx.reservation.count({
                        where: { customerEmail: input.email, createdAt: { gte: since } },
                    }),
                    tx.reservation.findFirst({
                        where: {
                            customerEmail: input.email,
                            productId: product.id,
                            status: { in: [...openReservationStatuses] },
                        },
                        select: { reference: true },
                    }),
                ]);

                if (recentCount >= MAX_RESERVATIONS_PER_EMAIL_PER_DAY) {
                    throw new ReservationError(
                        "RATE_LIMITED",
                        "Atingiu o limite de reservas por dia. Contacte-nos se precisar de ajuda.",
                    );
                }

                if (openDuplicate) {
                    throw new ReservationError(
                        "DUPLICATE",
                        `Já tem uma reserva em curso para este produto (${openDuplicate.reference}).`,
                    );
                }

                return tx.reservation.create({
                    data: {
                        reference: generateReference("RSV"),
                        productId: product.id,
                        quantity: input.quantity,
                        unitPriceCents: product.priceCents,
                        customerName: input.name,
                        customerEmail: input.email,
                        customerPhone: input.phone,
                        customerNotes: input.notes,
                        privacyConsentAt: new Date(),
                        userId,
                        events: {
                            create: { toStatus: "PENDING", actor: "CUSTOMER" },
                        },
                    },
                    select: { reference: true },
                });
            });
        } catch (error) {
            if (!isUniqueViolation(error)) {
                throw error;
            }

            // Either a concurrent duplicate hit the partial unique index…
            const duplicate = await db.reservation.findFirst({
                where: {
                    customerEmail: input.email,
                    productId: input.productId,
                    status: { in: [...openReservationStatuses] },
                },
                select: { reference: true },
            });

            if (duplicate) {
                throw new ReservationError(
                    "DUPLICATE",
                    `Já tem uma reserva em curso para este produto (${duplicate.reference}).`,
                );
            }

            // …or (extremely unlikely) the reference collided: retry.
            if (attempt === REFERENCE_ATTEMPTS) {
                throw error;
            }
        }
    }

    throw new Error("Could not generate a unique reservation reference.");
}

type ReservationActor = "CUSTOMER" | "ADMIN" | "SYSTEM";

/**
 * Applies a status transition inside an existing transaction.
 *
 * - Compare-and-set on `status`, so two concurrent transitions can never
 *   both succeed.
 * - Confirming tries to hold the units (atomic conditional UPDATE); items
 *   without stock (pre-order, supplier order) are confirmed without a hold.
 * - Cancelling or expiring releases a hold if there is one.
 *
 * @returns whether the product's stock changed (for page revalidation).
 */
export async function applyReservationTransition(
    tx: Prisma.TransactionClient,
    {
        reservationId,
        to,
        actor,
        note,
        expiresAt,
    }: {
        reservationId: string;
        to: ReservationStatus;
        actor: ReservationActor;
        note?: string;
        expiresAt?: Date;
    },
) {
    const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { id: true, status: true, productId: true, quantity: true, stockHeld: true },
    });

    if (!reservation) {
        throw new ReservationError("NOT_FOUND", "Reserva não encontrada.");
    }

    if (!canTransition(reservation.status, to)) {
        throw new ReservationError(
            "INVALID_TRANSITION",
            `Não é possível passar de ${reservation.status} para ${to}.`,
        );
    }

    let stockHeld = reservation.stockHeld;
    let stockChanged = false;

    if (to === "CONFIRMED" && !stockHeld) {
        stockHeld = await reserveStock(tx, reservation.productId, reservation.quantity);
        stockChanged = stockHeld;
    } else if ((to === "CANCELLED" || to === "EXPIRED") && stockHeld) {
        await releaseStock(tx, reservation.productId, reservation.quantity);
        stockHeld = false;
        stockChanged = true;
    }

    const { count } = await tx.reservation.updateMany({
        where: { id: reservation.id, status: reservation.status },
        data: { status: to, stockHeld, ...(expiresAt ? { expiresAt } : {}) },
    });

    if (count === 0) {
        throw new ReservationError(
            "CONFLICT",
            "A reserva foi alterada entretanto. Atualize e tente novamente.",
        );
    }

    await tx.reservationEvent.create({
        data: {
            reservationId: reservation.id,
            fromStatus: reservation.status,
            toStatus: to,
            actor,
            note,
        },
    });

    return { productId: reservation.productId, stockChanged, stockHeld };
}

/** Public summary for the customer: no personal data is exposed. */
export async function getPublicReservation(reference: string) {
    if (!isReference(reference, "RSV")) {
        return null;
    }

    return db.reservation.findUnique({
        where: { reference },
        select: {
            reference: true,
            status: true,
            quantity: true,
            unitPriceCents: true,
            createdAt: true,
            product: {
                select: {
                    name: true,
                    slug: true,
                    brand: { select: { name: true, slug: true } },
                    images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
                },
            },
        },
    });
}
