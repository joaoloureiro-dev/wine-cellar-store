import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/admin/categories";

export const metadata: Metadata = { title: "Categorias · Backoffice" };

export default async function AdminCategoriesPage() {
    await requireAdmin("/admin/categorias");
    const categories = await listAdminCategories();

    return (
        <>
            <AccountHeading
                title="Categorias"
                action={
                    <Link href="/admin/categorias/nova" className={primaryLinkClass}>
                        <Plus size={16} aria-hidden="true" /> Nova categoria
                    </Link>
                }
            />
            {categories.length > 0 ? (
                <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                    {categories.map((category) => (
                        <li key={category.id}>
                            <Link
                                href={`/admin/categorias/${category.id}`}
                                className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:p-5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-charcoal">{category.name}</p>
                                    <p className="truncate text-xs text-muted">
                                        Ordem {category.position} · /categorias/{category.slug}
                                    </p>
                                </div>
                                <span className="text-xs text-muted">
                                    {category._count.products} {category._count.products === 1 ? "produto" : "produtos"}
                                </span>
                                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="text-muted" />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">Ainda não há categorias. Crie a primeira para organizar o catálogo.</p>
            )}
        </>
    );
}
