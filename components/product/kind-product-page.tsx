import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronDown } from "lucide-react";

import type { ListedKind } from "@/components/catalog/kind-listing";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { ProductDimensions } from "@/components/product/product-dimensions";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductServices } from "@/components/product/product-services";
import { ProductSpecs } from "@/components/product/product-specs";
import { JsonLd } from "@/components/seo/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProductImageAlt, productKindLabels } from "@/lib/product-display";
import { getProductBySlugAndKind, getProductsByKind } from "@/lib/products";
import { getBrandHref, getProductHref, kindPaths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, jsonLdGraph, organizationNode, productNode } from "@/lib/seo/structured-data";

type KindProductParams = Promise<{ brand: string; slug: string }>;

export async function kindProductStaticParams(kind: ListedKind) {
    const products = await getProductsByKind(kind);

    return products.map((product) => ({ brand: product.brandSlug, slug: product.slug }));
}

export async function kindProductMetadata(kind: ListedKind, params: KindProductParams): Promise<Metadata> {
    const product = await getProductBySlugAndKind(kind, (await params).slug);

    if (!product) return {};

    return pageMetadata({ title: product.seo.title, description: product.seo.description, path: getProductHref(product) });
}

/** Product page for climate units, wine racks and accessories. */
export async function KindProductPage({ kind, params }: { kind: ListedKind; params: KindProductParams }) {
    const { brand: brandSlug, slug } = await params;
    const product = await getProductBySlugAndKind(kind, slug);

    if (!product) notFound();

    // Same as /caves: a wrong brand segment redirects to the canonical URL.
    if (product.brandSlug !== brandSlug) permanentRedirect(getProductHref(product));

    const related = (await getProductsByKind(kind)).filter((other) => other.id !== product.id).slice(0, 3);
    const breadcrumbs = [
        { label: "Início", href: "/" },
        { label: productKindLabels[kind].plural, href: kindPaths[kind] },
        { label: product.brand, href: getBrandHref(product.brandSlug) },
        { label: product.name },
    ];

    return (
        <main>
            <JsonLd data={jsonLdGraph(productNode(product), organizationNode(), breadcrumbNode(breadcrumbs, getProductHref(product)))} />
            <Container className="pt-6 sm:pt-8 lg:pt-10">
                <Breadcrumbs items={breadcrumbs} />
            </Container>

            <Container className="py-6 sm:py-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-20">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <ProductGallery images={product.images} alt={getProductImageAlt(product)} />
                    </div>

                    <div className="flex flex-col gap-5">
                        <ProductPurchasePanel product={product} />
                        <ProductServices />
                    </div>
                </div>
            </Container>

            <section aria-labelledby="product-details-heading" className="border-t border-border bg-surface-muted/50">
                <Container className="py-14 sm:py-16 lg:py-24">
                    <SectionHeading id="product-details-heading" eyebrow="Detalhes" title="Conheça o produto em pormenor" className="reveal" />

                    <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:gap-6">
                        <article className="reveal rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-card sm:p-8">
                            <h3 className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal">Descrição</h3>
                            <p className="mt-4 text-base leading-8 text-muted">{product.description}</p>
                        </article>

                        {product.dimensions && (
                            <article className="reveal rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-card sm:p-8">
                                <h3 className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal">Dimensões</h3>
                                <p className="mt-1 text-sm text-muted">Confirme se cabe no espaço que tem disponível.</p>
                                <div className="mt-6">
                                    <ProductDimensions dimensions={product.dimensions} weight={product.weight} />
                                </div>
                            </article>
                        )}

                        <details className="reveal group/specs rounded-3xl border border-charcoal/8 bg-surface shadow-card lg:col-span-2" open>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine sm:p-8 [&::-webkit-details-marker]:hidden">
                                <h3 className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal">Ficha técnica</h3>
                                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-charcoal transition-transform duration-300 ease-cellar group-open/specs:rotate-180 motion-reduce:transition-none">
                                    <ChevronDown size={18} strokeWidth={1.8} aria-hidden="true" />
                                </span>
                            </summary>

                            <div className="px-6 pb-6 group-open/specs:animate-rise motion-reduce:animate-none sm:px-8 sm:pb-8 lg:columns-2 lg:gap-12">
                                <ProductSpecs product={product} />
                            </div>
                        </details>
                    </div>
                </Container>
            </section>

            {related.length > 0 && (
                <section aria-labelledby="related-products-heading">
                    <Container className="py-14 sm:py-16 lg:py-24">
                        <SectionHeading id="related-products-heading" eyebrow="Seleção" title="Também lhe pode interessar" className="reveal" />
                        <div className="mt-10">
                            <ProductGrid products={related} headingLevel="h3" />
                        </div>
                    </Container>
                </section>
            )}
        </main>
    );
}
