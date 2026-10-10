import type { Metadata } from "next";

import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { getProductCountLabel, productKindLabels } from "@/lib/product-display";
import { getProductsByKind } from "@/lib/products";
import { kindPaths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, jsonLdGraph } from "@/lib/seo/structured-data";
import type { ProductKind } from "@/types/product";

/** Kinds with their own listing outside the filterable /caves catalogue. */
export type ListedKind = Exclude<ProductKind, "wine-cellar">;

const listingCopy: Record<ListedKind, { description: string; intro: string; empty: string }> = {
    "climate-unit": {
        description: "Climatizadores para transformar uma divisão ou adega numa cave de vinho, com temperatura e humidade controladas.",
        intro: "Escolha pelo volume da divisão a climatizar: o climatizador mantém a temperatura e a humidade certas para guardar vinho.",
        empty: "De momento não temos climatizadores disponíveis.",
    },
    "wine-rack": {
        description: "Garrafeiras e estantes para guardar garrafas deitadas, em casa ou numa adega climatizada.",
        intro: "Estantes e módulos para organizar a coleção, com as garrafas deitadas para manter a rolha húmida.",
        empty: "De momento não temos garrafeiras disponíveis.",
    },
    accessory: {
        description: "Acessórios para caves de vinho: prateleiras, termómetros, filtros e outros complementos.",
        intro: "Complementos para a sua cave: prateleiras, filtros, termómetros e o que mais precisar.",
        empty: "De momento não temos acessórios disponíveis.",
    },
};

function breadcrumbsFor(kind: ListedKind) {
    return [{ label: "Início", href: "/" }, { label: productKindLabels[kind].plural }];
}

export function kindListingMetadata(kind: ListedKind): Metadata {
    return pageMetadata({ title: productKindLabels[kind].plural, description: listingCopy[kind].description, path: kindPaths[kind] });
}

/**
 * Listing for a non-cellar kind. These ranges are small and have no
 * filters, so the page is static (cached with the catalogue) and works
 * without JavaScript.
 */
export async function KindListing({ kind }: { kind: ListedKind }) {
    const products = await getProductsByKind(kind);
    const breadcrumbs = breadcrumbsFor(kind);

    return (
        <main>
            <JsonLd data={jsonLdGraph(breadcrumbNode(breadcrumbs, kindPaths[kind]))} />
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Catálogo"
                title={productKindLabels[kind].plural}
                description={listingCopy[kind].intro}
            />

            <Container className="py-6 sm:py-10 lg:py-14">
                <p className="border-b border-border pb-4 font-display text-xl font-medium text-charcoal sm:text-2xl">
                    {getProductCountLabel(products.length)}
                </p>

                <div className="mt-6 lg:mt-8">
                    <ProductGrid
                        products={products}
                        headingLevel="h2"
                        emptyState={{
                            title: "Sem modelos disponíveis",
                            description: `${listingCopy[kind].empty} Veja as nossas caves de vinho.`,
                            action: { label: "Ver caves de vinho", href: "/caves" },
                        }}
                    />
                </div>
            </Container>
        </main>
    );
}
