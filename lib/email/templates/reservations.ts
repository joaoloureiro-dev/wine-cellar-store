import "server-only";

import { db } from "@/lib/db";
import { renderEmail } from "@/lib/email/layout";
import { formatCurrency } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo/metadata";

const date = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "Europe/Lisbon" });

/** Statuses customers are told about. AWAITING_PAYMENT is arranged with them directly. */
export const notifiedReservationStatuses = ["CONFIRMED", "PAID", "CANCELLED", "EXPIRED"] as const;
export type NotifiedReservationStatus = (typeof notifiedReservationStatuses)[number];

async function loadReservation(reservationId: unknown) {
    if (typeof reservationId !== "string") return null;

    return db.reservation.findUnique({
        where: { id: reservationId },
        select: {
            reference: true,
            status: true,
            quantity: true,
            unitPriceCents: true,
            customerName: true,
            customerPhone: true,
            stockHeld: true,
            expiresAt: true,
            product: { select: { name: true } },
        },
    });
}

type LoadedReservation = NonNullable<Awaited<ReturnType<typeof loadReservation>>>;

const reservationUrl = (reference: string) => absoluteUrl(`/reservas/${reference}`);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function details(reservation: LoadedReservation) {
    return {
        kind: "details" as const,
        rows: [
            ["Referência", reservation.reference],
            ["Produto", `${reservation.product.name} × ${reservation.quantity}`],
            ["Preço unitário", formatCurrency(reservation.unitPriceCents / 100)],
        ] as [string, string][],
    };
}

export async function renderReservationReceived(payload: Record<string, unknown>) {
    const reservation = await loadReservation(payload.reservationId);
    if (!reservation) return null;

    return renderEmail({
        subject: `Pedido de reserva ${reservation.reference} recebido`,
        preheader: "Vamos verificar a disponibilidade e responder-lhe.",
        heading: `Obrigado, ${firstName(reservation.customerName)}`,
        blocks: [
            { kind: "paragraph", text: "Recebemos o seu pedido de reserva. Vamos verificar a disponibilidade e contactá-lo. Este pedido não é uma compra e não tem custos." },
            details(reservation),
            { kind: "button", label: "Acompanhar reserva", href: reservationUrl(reservation.reference) },
        ],
    });
}

export async function renderReservationStatus(payload: Record<string, unknown>) {
    const reservation = await loadReservation(payload.reservationId);
    const status = payload.status as NotifiedReservationStatus;
    if (!reservation || !notifiedReservationStatuses.includes(status)) return null;

    const copy: Record<NotifiedReservationStatus, { subject: string; heading: string; text: string }> = {
        CONFIRMED: {
            subject: `Reserva ${reservation.reference} confirmada`,
            heading: "Reserva confirmada",
            text:
                reservation.stockHeld && reservation.expiresAt
                    ? `Guardámos a cave para si até ${date.format(reservation.expiresAt)}. Vamos contactá-lo para combinar o pagamento e a entrega.`
                    : "Confirmámos a sua reserva. Vamos contactá-lo assim que a cave estiver disponível para combinar o pagamento e a entrega.",
        },
        PAID: {
            subject: `Reserva ${reservation.reference} paga`,
            heading: "Pagamento recebido",
            text: "Recebemos o pagamento da sua reserva. Vamos contactá-lo para agendar a entrega.",
        },
        CANCELLED: {
            subject: `Reserva ${reservation.reference} cancelada`,
            heading: "Reserva cancelada",
            text: "A sua reserva foi cancelada. Se tiver dúvidas, responda a este email.",
        },
        EXPIRED: {
            subject: `Reserva ${reservation.reference} expirou`,
            heading: "Reserva expirada",
            text: "O prazo da sua reserva terminou e a cave deixou de estar guardada. Pode fazer um novo pedido quando quiser.",
        },
    };

    return renderEmail({
        subject: copy[status].subject,
        preheader: copy[status].heading,
        heading: copy[status].heading,
        blocks: [
            { kind: "paragraph", text: `Olá ${firstName(reservation.customerName)},` },
            { kind: "paragraph", text: copy[status].text },
            details(reservation),
            { kind: "button", label: "Ver reserva", href: reservationUrl(reservation.reference) },
        ],
    });
}

export async function renderAdminNewReservation(payload: Record<string, unknown>) {
    const reservation = await loadReservation(payload.reservationId);
    if (!reservation) return null;

    return renderEmail({
        subject: `Novo pedido de reserva ${reservation.reference}`,
        preheader: `${reservation.customerName} · ${reservation.product.name}`,
        heading: "Novo pedido de reserva",
        blocks: [
            details(reservation),
            { kind: "details", rows: [["Cliente", reservation.customerName], ["Telefone", reservation.customerPhone]] },
            { kind: "button", label: "Abrir no backoffice", href: absoluteUrl(`/admin/reservas/${reservation.reference}`) },
        ],
    });
}
