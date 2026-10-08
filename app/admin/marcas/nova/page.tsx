import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { BrandForm } from "@/components/admin/brand-form";
import { Panel } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Nova marca · Backoffice" };

export default async function NewBrandPage() {
    await requireAdmin("/admin/marcas/nova");

    return (
        <>
            <Link href="/admin/marcas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Marcas
            </Link>
            <div className="mt-4">
                <AccountHeading title="Nova marca" />
            </div>
            <Panel title="Dados da marca">
                <BrandForm />
            </Panel>
        </>
    );
}
