import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { BrandForm } from "@/components/admin/brand-form";
import { Panel } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminBrand } from "@/lib/admin/brands";

export const metadata: Metadata = { title: "Marca · Backoffice" };

export default async function EditBrandPage({ params }: PageProps<"/admin/marcas/[id]">) {
    const { id } = await params;
    await requireAdmin(`/admin/marcas/${id}`);
    const brand = await getAdminBrand(id);

    if (!brand) notFound();

    return (
        <>
            <Link href="/admin/marcas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Marcas
            </Link>
            <div className="mt-4">
                <AccountHeading title={brand.name} />
            </div>
            <Panel title="Dados da marca">
                <BrandForm brand={brand} />
            </Panel>
        </>
    );
}
