import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { Panel } from "@/components/admin/panel";
import { ProductDetailsForm } from "@/components/admin/product-details-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getBrandOptions } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Novo produto · Backoffice" };

export default async function NewProductPage() {
    await requireAdmin("/admin/produtos/novo");
    const brands = await getBrandOptions();

    return (
        <>
            <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Produtos
            </Link>
            <div className="mt-4">
                <AccountHeading title="Novo produto" description="O produto fica oculto até o publicar na página do produto." />
            </div>
            <Panel title="Dados do produto">
                <ProductDetailsForm brands={brands} />
            </Panel>
        </>
    );
}
