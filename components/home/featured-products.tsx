import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/products";

export async function FeaturedProducts() {
    const products = await getFeaturedProducts();

    if (products.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="featured-products-heading"
            className="border-b border-border bg-background py-16 sm:py-20 lg:py-28"
        >
            <Container>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="h-px w-8 bg-champagne" />

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine">
                                Seleção
                            </span>
                        </div>

                        <h2
                            id="featured-products-heading"
                            className="font-display text-4xl font-medium leading-none tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-6xl"
                        >
                            Caves em destaque
                        </h2>

                        <p className="mt-5 text-base leading-7 text-muted">
                            Modelos escolhidos pela fiabilidade, estabilidade térmica e
                            adequação a diferentes coleções.
                        </p>
                    </div>

                    <Link
                        href="/caves"
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-sm text-sm font-semibold text-charcoal underline-offset-4 transition-colors hover:text-wine hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine sm:self-auto"
                    >
                        Ver todas as caves
                        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                </div>

                <ul
                    role="list"
                    className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 sm:-mx-6 sm:mt-12 sm:gap-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0"
                >
                    {products.map((product) => (
                        <li
                            key={product.id}
                            className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
                        >
                            <ProductCard product={product} />
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
