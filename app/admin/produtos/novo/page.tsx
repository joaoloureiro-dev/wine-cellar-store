import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { Panel } from "@/components/admin/panel";
import { ProductDetailsForm } from "@/components/admin/product-details-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getCategoryOptions } from "@/lib/admin/categories";
import { adminKindFromParam, adminProductKinds } from "@/lib/admin/product-kinds";
import { getBrandOptions } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Novo produto · Backoffice" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/produtos/novo">) {
    await requireAdmin("/admin/produtos/novo");
    const kind = adminKindFromParam((await searchParams).tipo);
    const [brands, categories] = await Promise.all([getBrandOptions(), getCategoryOptions(kind)]);

    return (
        <>
            <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Produtos
            </Link>
            <div className="mt-4">
                <AccountHeading title="Novo produto" description="O produto fica oculto até o publicar na página do produto. O tipo não muda depois de criado." />
            </div>
            <nav aria-label="Tipo de produto" className="mb-6 flex flex-wrap gap-2">
                {adminProductKinds.map((option) => (
                    <Link
                        key={option.value}
                        href={`/admin/produtos/novo?tipo=${option.param}`}
                        aria-current={option.value === kind ? "page" : undefined}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:border-wine aria-[current=page]:border-wine aria-[current=page]:bg-wine aria-[current=page]:text-white"
                    >
                        {option.label}
                    </Link>
                ))}
            </nav>
            <Panel title="Dados do produto">
                <ProductDetailsForm key={kind} brands={brands} categories={categories} kind={kind} />
            </Panel>
        </>
    );
}
