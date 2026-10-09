import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Nova categoria · Backoffice" };

export default async function NewCategoryPage() {
    await requireAdmin("/admin/categorias/nova");

    return (
        <>
            <Link href="/admin/categorias" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine hover:text-wine-dark">
                <ArrowLeft size={15} aria-hidden="true" /> Categorias
            </Link>
            <div className="mt-4">
                <AccountHeading title="Nova categoria" />
            </div>
            <Panel title="Dados da categoria">
                <CategoryForm />
            </Panel>
        </>
    );
}
