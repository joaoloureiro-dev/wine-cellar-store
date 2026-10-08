import "server-only";

import { db } from "@/lib/db";
import { renderEmail, type EmailBlock } from "@/lib/email/layout";
import { formatCurrency } from "@/lib/format";
import { orderStatusLabels } from "@/lib/orders/status";
import { getBankTransferDetails } from "@/lib/payments/config";
import { absoluteUrl } from "@/lib/seo/metadata";

const euros = (cents: number) => formatCurrency(cents / 100);
const dateTime = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Lisbon" });

/** Statuses customers are told about (PROCESSING is internal). */
export const notifiedOrderStatuses = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "EXPIRED"] as const;
export type NotifiedOrderStatus = (typeof notifiedOrderStatuses)[number];

async function loadOrder(orderId: unknown) {
    if (typeof orderId !== "string") return null;

    return db.order.findUnique({
        where: { id: orderId },
        select: {
            reference: true,
            status: true,
            paymentMethod: true,
            subtotalCents: true,
            shippingCents: true,
            totalCents: true,
            customerName: true,
            customerEmail: true,
            paymentDueAt: true,
            items: { select: { productName: true, quantity: true, lineTotalCents: true } },
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { status: true, mbEntity: true, mbReference: true, checkoutUrl: true },
            },
        },
    });
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

const orderUrl = (reference: string) => absoluteUrl(`/encomendas/${reference}`);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function summaryBlock(order: LoadedOrder): EmailBlock {
    return {
        kind: "details",
        rows: [
            ...order.items.map((item): [string, string] => [`${item.productName} × ${item.quantity}`, euros(item.lineTotalCents)]),
            ["Entrega", order.shippingCents === 0 ? "Grátis" : euros(order.shippingCents)],
            ["Total", euros(order.totalCents)],
        ],
    };
}

/** How to pay, from the latest payment attempt at send time. */
function paymentBlocks(order: LoadedOrder): EmailBlock[] {
    const payment = order.payments[0];
    const due = `Prazo: ${dateTime.format(order.paymentDueAt)}. Depois disso, a encomenda é cancelada e o stock libertado.`;

    switch (order.paymentMethod) {
        case "MULTIBANCO":
            return payment?.mbEntity && payment.mbReference
                ? [
                      { kind: "paragraph", text: "Pague num multibanco ou no homebanking com estes dados:" },
                      { kind: "details", rows: [["Entidade", payment.mbEntity], ["Referência", payment.mbReference.replace(/(\d{3})(?=\d)/g, "$1 ")], ["Valor", euros(order.totalCents)]] },
                      { kind: "note", text: due },
                  ]
                : [{ kind: "paragraph", text: "Obtenha a referência Multibanco na página da encomenda." }, { kind: "note", text: due }];
        case "BANK_TRANSFER": {
            const bank = getBankTransferDetails();
            return bank
                ? [
                      { kind: "paragraph", text: "Faça a transferência com estes dados e indique a referência da encomenda no descritivo:" },
                      {
                          kind: "details",
                          rows: [
                              ["IBAN", bank.iban],
                              ...(bank.bic ? [["BIC/SWIFT", bank.bic] as [string, string]] : []),
                              ["Titular", bank.holder],
                              ["Descritivo", order.reference],
                              ["Valor", euros(order.totalCents)],
                          ],
                      },
                      { kind: "note", text: due },
                  ]
                : [{ kind: "paragraph", text: "Consulte os dados para transferência na página da encomenda." }];
        }
        case "MBWAY":
            return [
                { kind: "paragraph", text: "Enviámos um pedido de pagamento para a sua aplicação MB WAY. Se expirou, pode pedir outro na página da encomenda." },
            ];
        case "KLARNA":
            return [{ kind: "paragraph", text: "Conclua o pagamento na Klarna a partir da página da encomenda." }];
    }
}

export async function renderOrderReceived(payload: Record<string, unknown>) {
    const order = await loadOrder(payload.orderId);
    if (!order) return null;

    const awaitingPayment = order.status === "AWAITING_PAYMENT";

    return renderEmail({
        subject: `Encomenda ${order.reference} recebida`,
        preheader: awaitingPayment ? "Falta apenas o pagamento." : "Obrigado pela sua encomenda.",
        heading: `Obrigado, ${firstName(order.customerName)}`,
        blocks: [
            { kind: "paragraph", text: `Recebemos a sua encomenda ${order.reference}.` },
            summaryBlock(order),
            ...(awaitingPayment ? paymentBlocks(order) : []),
            { kind: "button", label: "Ver encomenda", href: orderUrl(order.reference) },
            { kind: "note", text: "Depois de confirmado o pagamento, contactamo-lo para agendar a entrega." },
        ],
    });
}

const statusCopy: Record<NotifiedOrderStatus, { subject: (reference: string) => string; heading: string; text: string }> = {
    PAID: {
        subject: (reference) => `Pagamento confirmado · ${reference}`,
        heading: "Pagamento confirmado",
        text: "Recebemos o pagamento. Vamos preparar a sua cave e contactá-lo para agendar a entrega.",
    },
    SHIPPED: {
        subject: (reference) => `A sua encomenda ${reference} foi enviada`,
        heading: "A caminho",
        text: "A sua encomenda saiu do nosso armazém. A transportadora vai contactá-lo antes da entrega.",
    },
    DELIVERED: {
        subject: (reference) => `Encomenda ${reference} entregue`,
        heading: "Encomenda entregue",
        text: "Esperamos que aproveite a sua nova cave. Antes de a ligar, deixe-a na vertical durante algumas horas, como indicado pelo fabricante.",
    },
    CANCELLED: {
        subject: (reference) => `Encomenda ${reference} cancelada`,
        heading: "Encomenda cancelada",
        text: "A sua encomenda foi cancelada. Se já tinha pago, o reembolso é feito pelo mesmo meio de pagamento. Contacte-nos se tiver dúvidas.",
    },
    EXPIRED: {
        subject: (reference) => `Encomenda ${reference} expirou`,
        heading: "Encomenda expirada",
        text: "Não recebemos o pagamento dentro do prazo, por isso a encomenda foi cancelada e os produtos voltaram ao stock. Pode fazer uma nova encomenda quando quiser.",
    },
};

export async function renderOrderStatus(payload: Record<string, unknown>) {
    const order = await loadOrder(payload.orderId);
    const status = payload.status as NotifiedOrderStatus;
    const copy = statusCopy[status];
    if (!order || !copy) return null;

    return renderEmail({
        subject: copy.subject(order.reference),
        preheader: orderStatusLabels[status],
        heading: copy.heading,
        blocks: [
            { kind: "paragraph", text: `Olá ${firstName(order.customerName)},` },
            { kind: "paragraph", text: copy.text },
            summaryBlock(order),
            { kind: "button", label: "Ver encomenda", href: orderUrl(order.reference) },
        ],
    });
}

/** Alert for the shop (ADMIN_NOTIFICATION_EMAIL). */
export async function renderAdminNewOrder(payload: Record<string, unknown>) {
    const order = await loadOrder(payload.orderId);
    if (!order) return null;

    return renderEmail({
        subject: `Nova encomenda ${order.reference} · ${euros(order.totalCents)}`,
        preheader: `${order.customerName} · ${order.paymentMethod}`,
        heading: "Nova encomenda",
        blocks: [
            { kind: "details", rows: [["Referência", order.reference], ["Cliente", order.customerName], ["Pagamento", order.paymentMethod], ["Estado", orderStatusLabels[order.status]]] },
            summaryBlock(order),
            { kind: "button", label: "Abrir no backoffice", href: absoluteUrl(`/admin/encomendas/${order.reference}`) },
        ],
    });
}
