import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, EyeOff, Plus } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { StatusBadge } from "@/components/account/status-badge";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Pagination } from "@/components/admin/pagination";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/admin/auth";
import { stockStatusTone } from "@/lib/admin/format";
import { parseListParams } from "@/lib/admin/list-params";
import { listAdminProducts, stockStatusValues } from "@/lib/admin/products";
import { formatCurrency } from "@/lib/format";
import { stockStatusLabels } from "@/lib/product-display";
import type { StockStatus } from "@/types/product";

export const metadata: Metadata = { title: "Produtos · Backoffice" };

const pathname = "/admin/produtos";
const label = (status: string) => stockStatusLabels[status.toLowerCase() as StockStatus];
const statusOptions = stockStatusValues.map((value) => ({ value, label: label(value) }));

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
    await requireAdmin(pathname);
    const { status, q, page } = parseListParams(await searchParams, stockStatusValues);
    const { products, total, pageCount } = await listAdminProducts({ status, q, page });

    return (
        <>
            <AccountHeading
                title="Produtos"
                action={
                    <Link href={`${pathname}/novo`} className={primaryLinkClass}>
                        <Plus size={16} aria-hidden="true" /> Novo produto
                    </Link>
                }
            />
            <ListToolbar pathname={pathname} statuses={statusOptions} status={status} q={q} searchPlaceholder="Nome, SKU ou marca" />

            {products.length > 0 ? (
                <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                    {products.map((product) => (
                        <li key={product.id}>
                            <Link
                                href={`${pathname}/${product.id}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:p-5"
                            >
                                <div className="min-w-0">
                                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-charcoal">
                                        {product.name}
                                        {!product.active && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">
                                                <EyeOff size={12} aria-hidden="true" /> Oculto
                                            </span>
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-muted">
                                        {product.brand.name} · {product.sku}
                                    </p>
                                </div>
                                <span className="text-right text-sm font-semibold text-charcoal">{formatCurrency(product.priceCents / 100)}</span>
                                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                                    <StatusBadge label={label(product.stockStatus)} tone={stockStatusTone(product.stockStatus)} />
                                    <span className="text-xs text-muted">{product.stockQuantity} un.</span>
                                </div>
                                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="hidden text-muted sm:block" />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">
                    Nenhum produto encontrado com estes filtros.
                </p>
            )}

            <Pagination pathname={pathname} page={page} pageCount={pageCount} total={total} status={status} q={q} />
        </>
    );
}
