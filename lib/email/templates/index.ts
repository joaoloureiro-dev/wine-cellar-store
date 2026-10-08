import "server-only";

import type { RenderedEmail } from "@/lib/email/layout";
import { renderAdminNewOrder, renderOrderReceived, renderOrderStatus } from "@/lib/email/templates/orders";
import { renderAdminNewReservation, renderReservationReceived, renderReservationStatus } from "@/lib/email/templates/reservations";

/** Renders an email from its payload at send time; null when there is nothing to send. */
export type EmailTemplate = (payload: Record<string, unknown>) => Promise<RenderedEmail | null>;
export type EmailTemplates = Record<string, EmailTemplate>;

export const emailTemplates: EmailTemplates = {
    "order.received": renderOrderReceived,
    "order.status": renderOrderStatus,
    "admin.order": renderAdminNewOrder,
    "reservation.received": renderReservationReceived,
    "reservation.status": renderReservationStatus,
    "admin.reservation": renderAdminNewReservation,
};
