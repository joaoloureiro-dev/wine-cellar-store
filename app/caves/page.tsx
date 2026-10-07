import type { Metadata } from "next";
import { Suspense } from "react";

import { ActiveFilters } from "@/components/catalog/active-filters";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { Container } from "@/components/layout/container";
import { getBrands } from "@/lib/brands";
import {
    clearCatalogFilters,
    countActiveFilters,
    getCatalogHref,
    parseCatalogQuery,
    toCatalogSearchParams,
} from "@/lib/catalog/query";
import { getProductCountLabel } from "@/lib/product-display";
import { getAvailableEnergyClasses, getCatalogProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Caves de Vinho";
const description =
    "Catálogo de caves de vinho de livre instalação, encastre e sob bancada, com uma, duas ou três zonas de temperatura.";

async function getQuery(searchParams: PageProps<"/caves">["searchParams"]) {
    const [params, brands] = await Promise.all([searchParams, getBrands()]);

    return parseCatalogQuery(params, {
        brandSlugs: brands.map((brand) => brand.slug),
    });
}

export async function generateMetadata(
    props: PageProps<"/caves">,
): Promise<Metadata> {
    const query = await getQuery(props.searchParams);
    const isRefined = toCatalogSearchParams(query).size > 0;

    return {
        ...pageMetadata({ title, description, path: "/caves" }),
        // Filtered/sorted variants are useful for users but would create
        // near-duplicate pages for search engines.
        robots: isRefined ? { index: false, follow: true } : undefined,
    };
}

/**
 * The intro is part of the static shell; filters and results depend on the
 * query string, so they stream in behind a Suspense boundary.
 */
export default function CatalogPage(props: PageProps<"/caves">) {
    return (
        <main>
            <PageIntro
                breadcrumbs={[
                    { label: "Início", href: "/" },
                    { label: title },
                ]}
                eyebrow="Catálogo"
                title={title}
                description="Compare capacidades, zonas de temperatura e tipos de instalação para encontrar a cave certa para a sua coleção."
            />

            <Suspense fallback={<CatalogSkeleton />}>
                <CatalogResults searchParams={props.searchParams} />
            </Suspense>
        </main>
    );
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/caves">, "searchParams">) {
    const [query, brands, energyClasses] = await Promise.all([
        getQuery(searchParams),
        getBrands(),
        getAvailableEnergyClasses(),
    ]);

    const products = await getCatalogProducts(query);
    const queryKey = toCatalogSearchParams(query).toString();
    const activeFilterCount = countActiveFilters(query);

    return (
        <Container className="py-8 sm:py-12 lg:py-16">
            <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:gap-14">
                <aside aria-label="Filtros do catálogo" className="lg:sticky lg:top-6 lg:self-start">
                    <CatalogFilters
                        key={queryKey}
                        query={query}
                        brands={brands.map(({ slug, name }) => ({ slug, name }))}
                        energyClasses={energyClasses}
                        activeFilterCount={activeFilterCount}
                    />
                </aside>

                <div className="mt-5 lg:mt-0">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                        <p
                            aria-live="polite"
                            className="text-sm font-semibold text-charcoal"
                        >
                            {getProductCountLabel(products.length)}
                        </p>

                        <SortSelect key={queryKey} query={query} />
                    </div>

                    {activeFilterCount > 0 && (
                        <div className="mt-4">
                            <ActiveFilters
                                query={query}
                                brandNames={
                                    new Map(brands.map((brand) => [brand.slug, brand.name]))
                                }
                            />
                        </div>
                    )}

                    <div className="mt-6 lg:mt-8">
                        <ProductGrid
                            products={products}
                            layout="sidebar"
                            emptyState={{
                                title: "Nenhuma cave corresponde aos filtros",
                                description:
                                    "Experimente remover alguns filtros ou alargar o intervalo de preço para ver mais modelos.",
                                action: {
                                    label: "Limpar filtros",
                                    href: getCatalogHref(clearCatalogFilters(query)),
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
