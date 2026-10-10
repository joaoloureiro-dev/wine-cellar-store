import Link from "next/link";
import { Wine } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { buttonStyles } from "@/components/ui/button-styles";
import type { Product } from "@/types/product";

type EmptyState = {
    title: string;
    description: string;
    action: {
        label: string;
        href: string;
    };
};

type ProductGridProps = {
    products: Product[];
    /** `sidebar` leaves room for a filters column from `lg` up. */
    layout?: "full" | "sidebar";
    emptyState?: EmptyState;
    headingLevel?: "h2" | "h3";
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
    headingLevel = "h2",
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-14 text-center sm:py-20">
                <span className="inline-flex size-16 items-center justify-center rounded-full bg-wine-light text-wine">
                    <Wine size={28} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-balance font-display text-3xl font-medium tracking-[-0.02em] text-charcoal">
                    {emptyState.title}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                    {emptyState.description}
                </p>
                <Link href={emptyState.action.href} className={buttonStyles({ className: "mt-8" })}>
                    {emptyState.action.label}
                </Link>
            </div>
        );
    }

    const { grid, imageSizes } = layouts[layout];

    return (
        <ul role="list" className={`grid gap-5 sm:gap-6 xl:gap-8 ${grid}`}>
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard
                        product={product}
                        imageSizes={imageSizes}
                        headingLevel={headingLevel}
                    />
                </li>
            ))}
        </ul>
    );
}
