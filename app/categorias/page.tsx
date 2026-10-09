import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageIntro } from "@/components/catalog/page-intro";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategories } from "@/lib/categories";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductCountByCategory } from "@/lib/products";
import { getCategoryHref } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, jsonLdGraph } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
    title: "Categorias",
    description: "Caves de vinho organizadas por utilização: serviço, envelhecimento, espaços pequenos e mais.",
    path: "/categorias",
});

const breadcrumbs = [{ label: "Início", href: "/" }, { label: "Categorias" }];

export default async function CategoriesPage() {
    const [categories, productCounts] = await Promise.all([getCategories(), getProductCountByCategory()]);

    return (
        <main>
            <JsonLd data={jsonLdGraph(breadcrumbNode(breadcrumbs, "/categorias"))} />
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Catálogo"
                title="Categorias"
                description="Encontre a cave pela forma como a vai usar."
            />

            <Container className="py-10 sm:py-14 lg:py-20">
                <ul
                    role="list"
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
                >
                    {categories.map((category) => (
                        <li key={category.slug} className="reveal">
                            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-card transition-[transform,box-shadow,border-color] duration-500 ease-cellar focus-within:-translate-y-1 focus-within:shadow-lift hover:-translate-y-1 hover:border-champagne/40 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 sm:p-8">
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-champagne/25 transition-transform duration-700 ease-cellar group-hover:scale-110 motion-reduce:transition-none"
                                />

                                <h2 className="mt-4 font-display text-[2.5rem] font-medium leading-none tracking-[-0.03em] text-charcoal">
                                    <Link
                                        href={getCategoryHref(category.slug)}
                                        className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-wine focus-visible:after:ring-offset-2"
                                    >
                                        {category.name}
                                    </Link>
                                </h2>

                                <p className="mt-4 text-sm leading-6 text-muted">
                                    {category.description}
                                </p>

                                <div className="mt-auto flex items-center justify-between pt-8">
                                    <span className="rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-charcoal">
                                        {getProductCountLabel(
                                            productCounts.get(category.slug) ?? 0,
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="inline-flex size-11 items-center justify-center rounded-full border border-border text-charcoal transition-colors duration-300 group-hover:border-wine group-hover:bg-wine group-hover:text-white"
                                    >
                                        <ArrowRight size={18} strokeWidth={1.8} />
                                    </span>
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            </Container>
        </main>
    );
}
