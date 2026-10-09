import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminBrands } from "@/lib/admin/brands";

export const metadata: Metadata = { title: "Marcas · Backoffice" };

export default async function AdminBrandsPage() {
    await requireAdmin("/admin/marcas");
    const brands = await listAdminBrands();

    return (
        <>
            <AccountHeading
                title="Marcas"
                action={
                    <Link href="/admin/marcas/nova" className={primaryLinkClass}>
                        <Plus size={16} aria-hidden="true" /> Nova marca
                    </Link>
                }
            />
            {brands.length > 0 ? (
                <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                    {brands.map((brand) => (
                        <li key={brand.id}>
                            <Link
                                href={`/admin/marcas/${brand.id}`}
                                className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:p-5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-charcoal">{brand.name}</p>
                                    <p className="truncate text-xs text-muted">
                                        {brand.country} · /marcas/{brand.slug}
                                    </p>
                                </div>
                                <span className="text-xs text-muted">
                                    {brand._count.products} {brand._count.products === 1 ? "produto" : "produtos"}
                                </span>
                                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="text-muted" />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">Ainda não há marcas.</p>
            )}
        </>
    );
}
