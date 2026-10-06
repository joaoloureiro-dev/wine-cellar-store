import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageIntro } from "@/components/catalog/page-intro";
import { Container } from "@/components/layout/container";
import { getBrands } from "@/lib/brands";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductCountByBrand } from "@/lib/products";
import { getBrandHref } from "@/lib/routes";

export const metadata: Metadata = {
    title: "Marcas",
    description:
        "Conheça as marcas de caves de vinho disponíveis: La Sommelière, Avintage, Climadiff e outras.",
};

export default async function BrandsPage() {
    const [brands, productCounts] = await Promise.all([
        getBrands(),
        getProductCountByBrand(),
    ]);

    return (
        <main>
            <PageIntro
                breadcrumbs={[{ label: "Início", href: "/" }, { label: "Marcas" }]}
                eyebrow="Marcas"
                title="Marcas selecionadas"
                description="Trabalhamos com fabricantes especializados em conservação de vinho, escolhidos pela fiabilidade e qualidade de construção."
            />

            <Container className="py-10 sm:py-14 lg:py-20">
                <ul
                    role="list"
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
                >
                    {brands.map((brand) => (
                        <li key={brand.slug}>
                            <article className="group relative flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-shadow duration-300 focus-within:shadow-lg hover:shadow-lg sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                    {brand.country}
                                </p>

                                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-charcoal">
                                    <Link
                                        href={getBrandHref(brand.name)}
                                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-wine focus-visible:after:ring-offset-2"
                                    >
                                        {brand.name}
                                    </Link>
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-muted">
                                    {brand.description}
                                </p>

                                <div className="mt-auto flex items-center justify-between pt-8">
                                    <span className="text-sm font-semibold text-charcoal">
                                        {getProductCountLabel(
                                            productCounts.get(brand.slug) ?? 0,
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
