import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { orderStatusTone, StatusBadge } from "@/components/account/status-badge";
import { OrderActions } from "@/components/admin/order-actions";
import { Panel, Timeline } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/auth";
import { actorLabels, auditActionLabels, dateTime, paymentProviderLabels, paymentStatusLabels } from "@/lib/admin/format";
import { getAdminOrder, getOrderAuditLog } from "@/lib/admin/orders";
import { getPaymentMethodLabel } from "@/lib/checkout/payment-methods";
import { getShippingMethod } from "@/lib/checkout/shipping";
import { formatCurrency } from "@/lib/format";
import { orderStatusLabels } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Encomenda · Backoffice" };

const euros = (cents: number) => formatCurrency(cents / 100);

export default async function AdminOrderPage({ params }: PageProps<"/admin/encomendas/[reference]">) {
    const { reference } = await params;
    await requireAdmin(`/admin/encomendas/${reference}`);
    const order = await getAdminOrder(reference);

    if (!order) {
        notFound();
    }

    const auditLog = await getOrderAuditLog(order.id);

    return (
        <>
            <Link href="/admin/encomendas" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-wine hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine">
                <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                Encomendas
            </Link>

            <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">{order.reference}</h1>
                <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                <p className="w-full text-sm text-muted">
                    Criada a {dateTime.format(order.createdAt)} · {getPaymentMethodLabel(order.paymentMethod)}
                    {order.status === "AWAITING_PAYMENT" && ` · prazo de pagamento ${dateTime.format(order.paymentDueAt)}`}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-6">
                    <Panel title="Artigos">
                        <ul role="list" className="divide-y divide-border">
                            {order.items.map((item) => (
                                <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-charcoal">{item.productName}</p>
                                        <p className="text-xs text-muted">
                                            {item.sku} · {item.quantity} × {euros(item.unitPriceCents)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-charcoal">{euros(item.lineTotalCents)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{euros(order.subtotalCents)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted">Envio ({getShippingMethod(order.shippingMethod)?.label ?? order.shippingMethod})</dt><dd>{order.shippingCents === 0 ? "Grátis" : euros(order.shippingCents)}</dd></div>
                            <div className="flex justify-between text-base font-semibold text-charcoal"><dt>Total</dt><dd>{euros(order.totalCents)}</dd></div>
                        </dl>
                    </Panel>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Panel title="Cliente">
                            <p className="text-sm font-semibold text-charcoal">{order.customerName}</p>
                            <p className="mt-1 text-sm break-all"><a href={`mailto:${order.customerEmail}`} className="text-wine underline-offset-4 hover:underline">{order.customerEmail}</a></p>
                            <p className="text-sm"><a href={`tel:${order.customerPhone.replace(/\s+/g, "")}`} className="text-charcoal">{order.customerPhone}</a></p>
                            {order.taxId && <p className="mt-2 text-sm text-muted">NIF {order.taxId}</p>}
                            <p className="mt-2 text-xs text-muted">{order.user ? `Conta: ${order.user.email}` : "Compra sem conta"}</p>
                        </Panel>
                        <Panel title="Entrega">
                            <address className="text-sm not-italic leading-6 text-charcoal">
                                {order.addressLine1}
                                {order.addressLine2 && <><br />{order.addressLine2}</>}
                                <br />
                                {order.postalCode} {order.city}
                                <br />
                                {order.country}
                            </address>
                            {order.customerNotes && (
                                <p className="mt-3 rounded-md bg-surface-muted p-3 text-sm break-words text-charcoal">
                                    <span className="block text-xs font-semibold text-muted">Nota do cliente</span>
                                    {order.customerNotes}
                                </p>
                            )}
                        </Panel>
                    </div>

                    <Panel title="Pagamentos">
                        {order.payments.length > 0 ? (
                            <ul role="list" className="space-y-4">
                                {order.payments.map((payment) => (
                                    <li key={payment.id} className="rounded-lg border border-border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-charcoal">
                                                {getPaymentMethodLabel(payment.method)} · {paymentProviderLabels[payment.provider]}
                                            </p>
                                            <StatusBadge
                                                label={paymentStatusLabels[payment.status]}
                                                tone={payment.status === "PAID" ? "success" : payment.status === "PENDING" ? "warning" : "neutral"}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-muted">
                                            {euros(payment.amountCents)} · criado {dateTime.format(payment.createdAt)}
                                            {payment.paidAt && ` · pago ${dateTime.format(payment.paidAt)}`}
                                            {payment.providerReference && ` · ref. ${payment.providerReference}`}
                                        </p>
                                        {payment.failureReason && <p className="mt-1 text-xs text-danger">{payment.failureReason}</p>}
                                        {payment.events.length > 0 && (
                                            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted">
                                                {payment.events.map((event) => (
                                                    <li key={event.id}>
                                                        <span className="font-semibold text-charcoal">{event.type}</span> · {dateTime.format(event.createdAt)}
                                                        {event.message && ` · ${event.message}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted">Ainda não foi iniciado nenhum pagamento.</p>
                        )}
                    </Panel>
                </div>

                <div className="min-w-0 space-y-6">
                    <Panel title="Ações" className="xl:sticky xl:top-6">
                        <OrderActions reference={order.reference} status={order.status} paymentMethod={order.paymentMethod} />
                    </Panel>
                    <Panel title="Histórico">
                        <Timeline
                            items={order.events.map((event) => ({
                                id: event.id,
                                title: orderStatusLabels[event.toStatus],
                                meta: `${dateTime.format(event.createdAt)} · ${actorLabels[event.actor]}`,
                                note: event.note,
                            }))}
                        />
                    </Panel>
                    {auditLog.length > 0 && (
                        <Panel title="Registo do backoffice">
                            <ul className="space-y-2 text-xs text-muted">
                                {auditLog.map((entry) => (
                                    <li key={entry.id}>
                                        <span className="font-semibold text-charcoal">{auditActionLabels[entry.action] ?? entry.action}</span> · {entry.actorEmail} · {dateTime.format(entry.createdAt)}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </div>
            </div>
        </>
    );
}
