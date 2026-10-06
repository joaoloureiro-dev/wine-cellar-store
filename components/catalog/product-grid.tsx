import Link from "next/link";
import { Wine } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import type { WineCellarProduct } from "@/types/product";

type EmptyState = {
    title: string;
    description: string;
    action: {
        label: string;
        href: string;
    };
};

type ProductGridProps = {
    products: WineCellarProduct[];
    /** `sidebar` leaves room for a filters column from `lg` up. */
    layout?: "full" | "sidebar";
    emptyState?: EmptyState;
};

const defaultEmptyState: EmptyState = {
    title: "Sem modelos disponíveis",
    description:
        "De momento não existem caves disponíveis nesta seleção. Explore o catálogo completo para encontrar alternativas.",
    action: {
        label: "Ver todas as caves",
        href: "/caves",
    },
};

const layouts = {
    full: {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        imageSizes:
            "(min-width: 1440px) 440px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw",
    },
    sidebar: {
        grid: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
        imageSizes:
            "(min-width: 1440px) 340px, (min-width: 1280px) 25vw, (min-width: 640px) 46vw, 100vw",
    },
} as const;

export function ProductGrid({
    products,
    layout = "full",
    emptyState = defaultEmptyState,
}: ProductGridProps) {
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
                    {emptyState.title}
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                    {emptyState.description}
                </p>

                <Link
                    href={emptyState.action.href}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    {emptyState.action.label}
                </Link>
            </div>
        );
    }

    const { grid, imageSizes } = layouts[layout];

    return (
        <ul role="list" className={`grid gap-5 sm:gap-6 lg:gap-8 ${grid}`}>
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard
                        product={product}
                        imageSizes={imageSizes}
                        headingLevel="h2"
                    />
                </li>
            ))}
        </ul>
    );
}
