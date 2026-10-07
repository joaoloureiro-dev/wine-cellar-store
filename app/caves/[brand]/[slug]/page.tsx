import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";

import { ProductGrid } from "@/components/catalog/product-grid";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductServices } from "@/components/product/product-services";
import { ProductSpecs } from "@/components/product/product-specs";
import {
    getProductHighlights,
    getProductImageAlt,
} from "@/lib/product-display";
import {
    getActiveProducts,
    getProductBySlug,
    getRelatedProducts,
} from "@/lib/products";
import { getBrandHref, getProductHref } from "@/lib/routes";

type ProductPageProps = PageProps<"/caves/[brand]/[slug]">;

// Time-based revalidation until tag-based invalidation (Cache stage).
export async function generateStaticParams() {
    const products = await getActiveProducts();

    return products.map((product) => ({
        brand: product.brandSlug,
        slug: product.slug,
    }));
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
    const { slug } = await props.params;
    const product = await getProductBySlug(slug);

    if (!product) {
        return {};
    }

    return {
        title: product.seo.title,
        description: product.seo.description,
    };
}

export default async function ProductPage(props: ProductPageProps) {
    const { brand: brandSlug, slug } = await props.params;
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    // Slugs are unique, so a wrong brand segment still identifies the product:
    // send visitors (and crawlers) to the single canonical URL.
    if (product.brandSlug !== brandSlug) {
        permanentRedirect(getProductHref(product));
    }

    const relatedProducts = await getRelatedProducts(product);
    const highlights = getProductHighlights(product);

    return (
        <main>
            <Container className="pt-6 sm:pt-8 lg:pt-10">
                <Breadcrumbs
                    items={[
                        { label: "Início", href: "/" },
                        { label: "Caves de Vinho", href: "/caves" },
                        { label: product.brand, href: getBrandHref(product.brandSlug) },
                        { label: product.name },
                    ]}
                />
            </Container>

            <Container className="py-6 sm:py-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
                    <div className="lg:sticky lg:top-6 lg:self-start">
                        <ProductGallery
                            images={product.images}
                            alt={getProductImageAlt(product)}
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <ProductPurchasePanel product={product} />
                        <ProductServices />
                    </div>
                </div>
            </Container>

            <section
                aria-labelledby="product-details-heading"
                className="border-t border-border bg-surface-muted/40"
            >
                <h2 id="product-details-heading" className="sr-only">
                    Detalhes do produto
                </h2>

                <Container className="grid gap-12 py-14 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
                    <div>
                        <h3 className="font-display text-3xl font-medium tracking-[-0.03em] text-charcoal sm:text-4xl">
                            Descrição
                        </h3>

                        <p className="mt-5 text-base leading-8 text-muted">
                            {product.description}
                        </p>

                        {highlights.length > 0 && (
                            <>
                                <h3 className="mt-10 font-display text-2xl font-medium tracking-[-0.02em] text-charcoal">
                                    Características principais
                                </h3>

                                <ul role="list" className="mt-5 space-y-3">
                                    {highlights.map((highlight) => (
                                        <li
                                            key={highlight}
                                            className="flex gap-3 text-sm leading-6 text-charcoal"
                                        >
                                            <Check
                                                size={18}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                                className="mt-0.5 shrink-0 text-wine"
                                            />
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <div>
                        <h3 className="font-display text-3xl font-medium tracking-[-0.03em] text-charcoal sm:text-4xl">
                            Ficha técnica
                        </h3>

                        <div className="mt-5">
                            <ProductSpecs product={product} />
                        </div>
                    </div>
                </Container>
            </section>

            {relatedProducts.length > 0 && (
                <section
                    aria-labelledby="related-products-heading"
                    className="border-t border-border"
                >
                    <Container className="py-14 sm:py-16 lg:py-20">
                        <h2
                            id="related-products-heading"
                            className="font-display text-3xl font-medium tracking-[-0.03em] text-charcoal sm:text-4xl"
                        >
                            Também lhe pode interessar
                        </h2>

                        <div className="mt-8 sm:mt-10">
                            <ProductGrid products={relatedProducts} headingLevel="h3" />
                        </div>
                    </Container>
                </section>
            )}
        </main>
    );
}
