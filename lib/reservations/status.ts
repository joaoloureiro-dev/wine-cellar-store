/**
 * Reservation lifecycle.
 *
 *   PENDING ──► CONFIRMED ──► AWAITING_PAYMENT ──► PAID
 *      │            │                │
 *      └────────────┴────────────────┴──► CANCELLED | EXPIRED
 *
 * PAID, CANCELLED and EXPIRED are terminal. A PAID reservation is later
 * converted into an order (checkout/payments stages).
 */

export const reservationStatuses = [
    "PENDING",
    "CONFIRMED",
    "AWAITING_PAYMENT",
    "PAID",
    "CANCELLED",
    "EXPIRED",
] as const;

export type ReservationStatus = (typeof reservationStatuses)[number];

const allowedTransitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED"],
    CONFIRMED: ["AWAITING_PAYMENT", "CANCELLED", "EXPIRED"],
    AWAITING_PAYMENT: ["PAID", "CANCELLED", "EXPIRED"],
    PAID: [],
    CANCELLED: [],
    EXPIRED: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus) {
    return allowedTransitions[from].includes(to);
}

export function isTerminalStatus(status: ReservationStatus) {
    return allowedTransitions[status].length === 0;
}

/** Statuses that still hold a customer's intent (used for duplicate checks). */
export const openReservationStatuses = [
    "PENDING",
    "CONFIRMED",
    "AWAITING_PAYMENT",
] as const satisfies readonly ReservationStatus[];

export const reservationStatusLabels: Record<ReservationStatus, string> = {
    PENDING: "Pendente de confirmação",
    CONFIRMED: "Confirmada",
    AWAITING_PAYMENT: "A aguardar pagamento",
    PAID: "Paga",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
};
