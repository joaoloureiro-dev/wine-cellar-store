import Link from "next/link";
import { Wine } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import type { WineCellarProduct } from "@/types/product";

type ProductGridProps = {
    products: WineCellarProduct[];
};

const gridImageSizes =
    "(min-width: 1440px) 440px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw";

export function ProductGrid({ products }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
                <Wine
                    size={32}
                    strokeWidth={1.3}
                    aria-hidden="true"
                    className="text-wine"
                />

                <h2 className="mt-4 font-display text-2xl font-semibold text-charcoal">
                    Sem modelos disponíveis
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                    De momento não existem caves disponíveis nesta seleção. Explore o
                    catálogo completo para encontrar alternativas.
                </p>

                <Link
                    href="/caves"
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    Ver todas as caves
                </Link>
            </div>
        );
    }

    return (
        <ul
            role="list"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
        >
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard
                        product={product}
                        imageSizes={gridImageSizes}
                        headingLevel="h2"
                    />
                </li>
            ))}
        </ul>
    );
}
