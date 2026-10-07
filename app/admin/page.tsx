import type { Metadata } from "next";
import Link from "next/link";

import { AccountHeading } from "@/components/account/account-heading";
import { LinkedSection } from "@/components/account/linked-section";
import { orderStatusTone, StatusBadge } from "@/components/account/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { requireAdmin } from "@/lib/admin/auth";
import { getDashboard } from "@/lib/admin/dashboard";
import { shortDate } from "@/lib/admin/format";
import { getPaymentMethodLabel } from "@/lib/checkout/payment-methods";
import { formatCurrency } from "@/lib/format";
import { orderStatusLabels } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Resumo · Backoffice" };

export default async function AdminDashboardPage() {
    const admin = await requireAdmin("/admin");
    const data = await getDashboard();

    return (
        <>
            <AccountHeading title="Resumo" description={`Sessão iniciada como ${admin.email}`} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Por preparar"
                    value={String(data.toFulfil)}
                    detail="Encomendas pagas ou em preparação"
                    href="/admin/encomendas?estado=PAID"
                    highlight={data.toFulfil > 0}
                />
                <StatCard
                    label="A aguardar pagamento"
                    value={String(data.awaitingPayment)}
                    detail={`${data.awaitingTransfer} por transferência bancária`}
                    href="/admin/encomendas?estado=AWAITING_PAYMENT"
                />
                <StatCard
                    label="Reservas pendentes"
                    value={String(data.pendingReservations)}
                    detail="A aguardar confirmação"
                    href="/admin/reservas?estado=PENDING"
                    highlight={data.pendingReservations > 0}
                />
                <StatCard
                    label="Recebido (30 dias)"
                    value={formatCurrency(data.revenueCents / 100)}
                    detail={`${data.paidCount} ${data.paidCount === 1 ? "pagamento" : "pagamentos"}`}
                />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <LinkedSection title="Encomendas recentes" href="/admin/encomendas" linkLabel="Ver todas">
                    {data.recentOrders.length > 0 ? (
                        <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                            {data.recentOrders.map((order) => (
                                <li key={order.reference}>
                                    <Link
                                        href={`/admin/encomendas/${order.reference}`}
                                        className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-sm font-semibold text-charcoal">{order.reference}</span>
                                                <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                                            </div>
                                            <p className="mt-1 truncate text-xs text-muted">
                                                {order.customerName} · {getPaymentMethodLabel(order.paymentMethod)} · {shortDate.format(order.createdAt)}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-charcoal">{formatCurrency(order.totalCents / 100)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted">Ainda não há encomendas.</p>
                    )}
                </LinkedSection>

                <LinkedSection title="Alertas de stock" href="/admin/produtos" linkLabel="Produtos">
                    {data.stockAlerts.length > 0 ? (
                        <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                            {data.stockAlerts.map((product) => (
                                <li key={product.id}>
                                    <Link
                                        href={`/admin/produtos/${product.id}`}
                                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-charcoal">{product.name}</p>
                                            <p className="text-xs text-muted">{product.sku}</p>
                                        </div>
                                        <StatusBadge
                                            label={product.stockQuantity === 0 ? "Esgotado" : `${product.stockQuantity} em stock`}
                                            tone={product.stockQuantity === 0 ? "neutral" : "warning"}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted">Sem produtos com stock baixo.</p>
                    )}
                </LinkedSection>
            </div>
        </>
    );
}
