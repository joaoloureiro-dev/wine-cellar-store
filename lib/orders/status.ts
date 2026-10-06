/**
 * Order lifecycle.
 *
 *   AWAITING_PAYMENT ──► PAID ──► PROCESSING ──► SHIPPED ──► DELIVERED
 *         │               │           │
 *         ├──► EXPIRED    └───────────┴──► CANCELLED
 *         └──► CANCELLED
 *
 * Moving to CANCELLED or EXPIRED releases the order's stock hold.
 */

export const orderStatuses = [
    "AWAITING_PAYMENT",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "EXPIRED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
    AWAITING_PAYMENT: ["PAID", "CANCELLED", "EXPIRED"],
    PAID: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
    EXPIRED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
    return allowedTransitions[from].includes(to);
}

export function releasesStock(to: OrderStatus) {
    return to === "CANCELLED" || to === "EXPIRED";
}

export const orderStatusLabels: Record<OrderStatus, string> = {
    AWAITING_PAYMENT: "A aguardar pagamento",
    PAID: "Paga",
    PROCESSING: "Em preparação",
    SHIPPED: "Enviada",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
};
