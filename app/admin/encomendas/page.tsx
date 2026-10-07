import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { orderStatusTone, StatusBadge } from "@/components/account/status-badge";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Pagination } from "@/components/admin/pagination";
import { requireAdmin } from "@/lib/admin/auth";
import { dateTime } from "@/lib/admin/format";
import { parseListParams } from "@/lib/admin/list-params";
import { listAdminOrders } from "@/lib/admin/orders";
import { getPaymentMethodLabel } from "@/lib/checkout/payment-methods";
import { formatCurrency } from "@/lib/format";
import { orderStatuses, orderStatusLabels } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Encomendas · Backoffice" };

const pathname = "/admin/encomendas";
const statusOptions = orderStatuses.map((value) => ({ value, label: orderStatusLabels[value] }));

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/encomendas">) {
    await requireAdmin(pathname);
    const { status, q, page } = parseListParams(await searchParams, orderStatuses);
    const { orders, total, pageCount } = await listAdminOrders({ status, q, page });

    return (
        <>
            <AccountHeading title="Encomendas" />
            <ListToolbar
                pathname={pathname}
                statuses={statusOptions}
                status={status}
                q={q}
                searchPlaceholder="Referência, nome ou email"
            />

            {orders.length > 0 ? (
                <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                    {orders.map((order) => (
                        <li key={order.reference}>
                            <Link
                                href={`${pathname}/${order.reference}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto] sm:p-5"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="text-sm font-semibold text-charcoal">{order.reference}</span>
                                        <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                                    </div>
                                    <p className="mt-1 text-xs text-muted">
                                        {dateTime.format(order.createdAt)} · {getPaymentMethodLabel(order.paymentMethod)}
                                    </p>
                                </div>
                                <div className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
                                    <p className="truncate text-sm text-charcoal">{order.customerName}</p>
                                    <p className="truncate text-xs text-muted">{order.customerEmail}</p>
                                </div>
                                <span className="row-span-2 text-right text-sm font-semibold text-charcoal sm:row-span-1">
                                    {formatCurrency(order.totalCents / 100)}
                                    <span className="block text-xs font-normal text-muted">
                                        {order._count.items} {order._count.items === 1 ? "artigo" : "artigos"}
                                    </span>
                                </span>
                                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="hidden text-muted sm:block" />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                    Nenhuma encomenda encontrada com estes filtros.
                </p>
            )}

            <Pagination pathname={pathname} page={page} pageCount={pageCount} total={total} status={status} q={q} />
        </>
    );
}
