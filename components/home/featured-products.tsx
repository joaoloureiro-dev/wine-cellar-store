import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFeaturedProducts } from "@/lib/products";

export async function FeaturedProducts() {
    const products = await getFeaturedProducts();

    if (products.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="featured-products-heading" className="py-16 sm:py-20 lg:py-28">
            <Container>
                <div className="reveal flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <SectionHeading
                        id="featured-products-heading"
                        eyebrow="Seleção"
                        title="Caves em destaque"
                        description="Modelos escolhidos pela fiabilidade, estabilidade térmica e adequação a diferentes coleções."
                    />

                    <Link
                        href="/caves"
                        className="group inline-flex shrink-0 items-center gap-2 self-start rounded-sm border-b border-champagne pb-1 text-sm font-semibold text-charcoal transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine sm:self-auto"
                    >
                        Ver todas as caves
                        <ArrowRight
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                            className="transition-transform duration-300 ease-cellar group-hover:translate-x-1 motion-reduce:transition-none"
                        />
                    </Link>
                </div>

                {/*
                  Swipeable row on small screens (CSS scroll snap, no JS);
                  a grid that fills the row from the laptop breakpoint.
                */}
                <ul
                    role="list"
                    className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-6 pt-2 sm:-mx-6 sm:mt-12 sm:gap-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] lg:gap-8 lg:overflow-visible lg:px-0"
                >
                    {products.map((product) => (
                        <li key={product.id} className="reveal w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                            <ProductCard product={product} />
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
