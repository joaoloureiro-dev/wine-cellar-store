import type { Metadata } from "next";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CalendarCheck,
    Landmark,
    PackageCheck,
    PackagePlus,
    Tag,
    Wallet,
} from "lucide-react";

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
                    icon={PackageCheck}
                />
                <StatCard
                    label="A aguardar pagamento"
                    value={String(data.awaitingPayment)}
                    detail={`${data.awaitingTransfer} por transferência bancária`}
                    href="/admin/encomendas?estado=AWAITING_PAYMENT"
                    icon={Wallet}
                />
                <StatCard
                    label="Reservas pendentes"
                    value={String(data.pendingReservations)}
                    detail="A aguardar confirmação"
                    href="/admin/reservas?estado=PENDING"
                    highlight={data.pendingReservations > 0}
                    icon={CalendarCheck}
                />
                <StatCard
                    label="Recebido (30 dias)"
                    value={formatCurrency(data.revenueCents / 100)}
                    detail={`${data.paidCount} ${data.paidCount === 1 ? "pagamento" : "pagamentos"}`}
                    icon={Banknote}
                    tone="dark"
                />
            </div>

            <nav aria-label="Atalhos" className="mt-6">
                <ul role="list" className="flex flex-wrap gap-2">
                    {[
                        { href: "/admin/produtos/novo", label: "Novo produto", icon: PackagePlus },
                        { href: "/admin/marcas/nova", label: "Nova marca", icon: Tag },
                        {
                            href: "/admin/encomendas?estado=AWAITING_PAYMENT",
                            label: "Transferências por confirmar",
                            icon: Landmark,
                        },
                    ].map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-charcoal transition-colors hover:border-champagne hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                            >
                                <Icon size={16} strokeWidth={1.8} aria-hidden="true" className="text-wine" />
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-6">
                <LinkedSection title="Encomendas recentes" href="/admin/encomendas" linkLabel="Ver todas">
                    {data.recentOrders.length > 0 ? (
                        <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                            {data.recentOrders.map((order) => (
                                <li key={order.reference}>
                                    <Link
                                        href={`/admin/encomendas/${order.reference}`}
                                        className="group flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:px-5"
                                    >
                                        <span aria-hidden="true" className="hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-wine sm:inline-flex">
                                            <PackageCheck size={18} strokeWidth={1.7} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-sm font-semibold text-charcoal">{order.reference}</span>
                                                <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                                            </div>
                                            <p className="mt-1 truncate text-xs text-muted">
                                                {order.customerName} · {getPaymentMethodLabel(order.paymentMethod)} · {shortDate.format(order.createdAt)}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold tabular-nums text-charcoal">{formatCurrency(order.totalCents / 100)}</span>
                                        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" className="hidden shrink-0 text-muted transition-transform duration-300 ease-cellar group-hover:translate-x-0.5 group-hover:text-wine motion-reduce:transition-none sm:block" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">Ainda não há encomendas.</p>
                    )}
                </LinkedSection>

                <LinkedSection title="Alertas de stock" href="/admin/produtos" linkLabel="Produtos">
                    {data.stockAlerts.length > 0 ? (
                        <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                            {data.stockAlerts.map((product) => (
                                <li key={product.id}>
                                    <Link
                                        href={`/admin/produtos/${product.id}`}
                                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:px-5"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                aria-hidden="true"
                                                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                                                    product.stockQuantity === 0 ? "bg-surface-muted text-muted" : "bg-warning/10 text-warning"
                                                }`}
                                            >
                                                <AlertTriangle size={18} strokeWidth={1.7} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-charcoal">{product.name}</p>
                                                <p className="text-xs text-muted">{product.sku}</p>
                                            </div>
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
                        <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">Sem produtos com stock baixo.</p>
                    )}
                </LinkedSection>
            </div>
        </>
    );
}
