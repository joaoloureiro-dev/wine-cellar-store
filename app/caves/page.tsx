import type { Metadata } from "next";

import { ActiveFilters } from "@/components/catalog/active-filters";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
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
import { breadcrumbNode, jsonLdGraph } from "@/lib/seo/structured-data";

const title = "Caves de Vinho";
const breadcrumbs = [
        { label: "Início", href: "/" },
        { label: title },
];
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
 * Rendered in full on each request, without a streamed Suspense boundary:
 * streamed content is revealed by a script, and the catalogue (filters,
 * sorting, results) must work without JavaScript. The data itself comes
 * from the catalogue cache, so this costs little.
 */
export const instant = false;

export default function CatalogPage(props: PageProps<"/caves">) {
    return (
        <main>
            <JsonLd data={jsonLdGraph(breadcrumbNode(breadcrumbs, "/caves"))} />
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Catálogo"
                title={title}
                description="Compare capacidades, zonas de temperatura e tipos de instalação para encontrar a cave certa para a sua coleção."
            />

            <CatalogResults searchParams={props.searchParams} />
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
        <Container className="py-6 sm:py-10 lg:py-14">
            <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-12">
                <aside
                    aria-label="Filtros do catálogo"
                    className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-charcoal/8 lg:bg-surface lg:px-6 lg:pb-6 lg:shadow-card"
                >
                    <CatalogFilters
                        key={queryKey}
                        query={query}
                        brands={brands.map(({ slug, name }) => ({ slug, name }))}
                        energyClasses={energyClasses}
                        activeFilterCount={activeFilterCount}
                    />
                </aside>

                <div className="mt-5 lg:mt-0">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-4 lg:pt-1">
                        <p
                            aria-live="polite"
                            className="font-display text-xl font-medium text-charcoal sm:text-2xl"
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
