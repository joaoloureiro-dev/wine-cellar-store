import Link from "next/link";

import { Container } from "@/components/layout/container";
import { getBrands } from "@/lib/brands";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductCountByBrand } from "@/lib/products";
import { getBrandHref } from "@/lib/routes";

export async function BrandStrip() {
    const [brands, productCounts] = await Promise.all([getBrands(), getProductCountByBrand()]);

    if (brands.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="brand-strip-heading" className="border-b border-border bg-background">
            <Container className="flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:gap-12 lg:py-10">
                <h2
                    id="brand-strip-heading"
                    className="shrink-0 text-[0.6875rem] font-bold uppercase tracking-[0.28em] text-champagne-ink"
                >
                    As nossas marcas
                </h2>

                <ul
                    role="list"
                    className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-1 lg:justify-between lg:gap-8 lg:overflow-visible lg:px-0"
                >
                    {brands.map((brand) => (
                        <li key={brand.slug} className="shrink-0 snap-start">
                            <Link
                                href={getBrandHref(brand.slug)}
                                className="group flex items-baseline gap-3 rounded-full border border-border bg-surface px-5 py-3 transition-colors hover:border-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:rounded-sm lg:border-transparent lg:bg-transparent lg:p-0 lg:hover:border-transparent"
                            >
                                <span className="font-display text-2xl font-medium tracking-[-0.02em] text-charcoal transition-colors group-hover:text-wine lg:text-[2rem]">
                                    {brand.name}
                                </span>
                                <span className="text-xs text-muted">
                                    {getProductCountLabel(productCounts.get(brand.slug) ?? 0)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
