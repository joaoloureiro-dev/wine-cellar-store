import type { Metadata } from "next";
import { Search } from "lucide-react";

import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container } from "@/components/layout/container";
import { MAX_QUERY_LENGTH, searchProducts } from "@/lib/catalog/search";
import { getProductCountLabel } from "@/lib/product-display";
import { getActiveProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Pesquisa";
const breadcrumbs = [{ label: "Início", href: "/" }, { label: title }];

export const metadata: Metadata = {
    ...pageMetadata({ title, description: "Pesquise caves de vinho por modelo, marca, capacidade, zonas ou tipo de instalação.", path: "/pesquisa" }),
    // Result pages are endless near-duplicates of the catalogue.
    robots: { index: false, follow: true },
};

/** Rendered in full on each request so the search works without JavaScript (see app/caves/page.tsx). */
export const instant = false;

function readQuery(params: Awaited<PageProps<"/pesquisa">["searchParams"]>) {
    const value = Array.isArray(params.q) ? params.q[0] : params.q;
    return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export default function SearchPage(props: PageProps<"/pesquisa">) {
    return (
        <main>
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Catálogo"
                title={title}
                description="Procure por modelo, marca, capacidade (ex.: 24 garrafas), zonas (ex.: 2 zonas) ou instalação (ex.: encastrável)."
            />
            <SearchResults searchParams={props.searchParams} />
        </main>
    );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/pesquisa">, "searchParams">) {
    const query = readQuery(await searchParams);
    const results = searchProducts(await getActiveProducts(), query);

    return (
        <Container className="py-8 sm:py-12">
            <form action="/pesquisa" role="search" className="flex max-w-2xl gap-3">
                <label htmlFor="q" className="sr-only">
                    Pesquisar caves de vinho
                </label>
                <input
                    key={query}
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={query}
                    maxLength={MAX_QUERY_LENGTH}
                    placeholder="Ex.: encastrável 2 zonas"
                    autoComplete="off"
                    className="min-h-12 w-full rounded-md border border-border bg-surface px-4 text-base text-charcoal focus:border-wine focus:outline-2 focus:outline-wine/30"
                />
                <button
                    type="submit"
                    className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    <Search size={17} aria-hidden="true" />
                    Pesquisar
                </button>
            </form>

            {results && (
                <>
                    <p aria-live="polite" className="mt-8 border-b border-border pb-4 text-sm font-semibold text-charcoal">
                        {getProductCountLabel(results.length)} para «{query}»
                    </p>
                    <div className="mt-6">
                        <ProductGrid
                            products={results}
                            emptyState={{
                                title: "Nenhuma cave encontrada",
                                description: "Verifique a ortografia ou pesquise por termos mais gerais, como a marca ou o número de garrafas.",
                                action: { label: "Ver todas as caves", href: "/caves" },
                            }}
                        />
                    </div>
                </>
            )}
        </Container>
    );
}
