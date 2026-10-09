import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminCategory } from "@/lib/admin/categories";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categoria · Backoffice" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categorias/[id]">) {
    const { id } = await params;
    await requireAdmin(`/admin/categorias/${id}`);
    const category = await getAdminCategory(id);

    if (!category) notFound();

    const productCount = await db.productCategory.count({ where: { categoryId: category.id } });

    return (
        <>
            <Link href="/admin/categorias" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Categorias
            </Link>
            <div className="mt-4">
                <AccountHeading
                    title={category.name}
                    description={`${productCount} ${productCount === 1 ? "produto" : "produtos"} nesta categoria. Atribua produtos na página de cada produto.`}
                />
                <Link href={`/categorias/${category.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-wine underline-offset-4 hover:underline">
                    Ver na loja <ExternalLink size={13} aria-hidden="true" />
                </Link>
            </div>
            <Panel title="Dados da categoria">
                <CategoryForm category={category} productCount={productCount} />
            </Panel>
        </>
    );
}
