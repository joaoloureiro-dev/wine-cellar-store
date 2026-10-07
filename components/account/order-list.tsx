import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { orderStatusTone, StatusBadge } from "@/components/account/status-badge";
import { formatCurrency } from "@/lib/format";
import { orderStatusLabels, type OrderStatus } from "@/lib/orders/status";

type OrderRow = {
    reference: string;
    status: OrderStatus;
    totalCents: number;
    createdAt: Date;
    items: { productName: string; quantity: number }[];
};

const date = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });

export function OrderList({ orders }: { orders: OrderRow[] }) {
    return (
        <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {orders.map((order) => (
                <li key={order.reference}>
                    <Link
                        href={`/encomendas/${order.reference}`}
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:p-5"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-sm font-semibold text-charcoal">{order.reference}</span>
                                <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                            </div>
                            <p className="mt-1 truncate text-sm text-muted">
                                {order.items.map((item) => `${item.quantity}× ${item.productName}`).join(", ")}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{date.format(order.createdAt)}</p>
                        </div>
                        <span className="text-sm font-semibold text-charcoal">{formatCurrency(order.totalCents / 100)}</span>
                        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-muted" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
