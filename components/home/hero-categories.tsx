import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { getCategories } from "@/lib/categories";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductCountByCategory } from "@/lib/products";
import { getCategoryHref } from "@/lib/routes";

/**
 * Category shortcuts at the foot of the hero. Each card opens the
 * category page with its products; empty categories are left out so a
 * click never lands on an empty listing. Data comes from cached loaders,
 * so the hero stays in the static shell.
 */
export async function HeroCategories() {
    const [categories, productCounts] = await Promise.all([getCategories(), getProductCountByCategory()]);
    const withProducts = categories.filter((category) => (productCounts.get(category.slug) ?? 0) > 0);

    if (withProducts.length === 0) {
        return null;
    }

    return (
        <nav aria-labelledby="hero-categories-heading" className="border-t border-cellar-ink/10 pb-10 pt-8 sm:pb-12 lg:pb-14">
            <div className="flex items-baseline justify-between gap-4">
                <h2
                    id="hero-categories-heading"
                    className="text-[0.6875rem] font-bold uppercase tracking-[0.28em] text-champagne-soft"
                >
                    Explorar por categoria
                </h2>
                <Link
                    href="/categorias"
                    className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-semibold text-cellar-ink transition-colors hover:text-champagne-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne-soft"
                >
                    Ver todas
                    <ArrowRight
                        size={15}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-cellar group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                </Link>
            </div>

            {/* Swipeable on small screens (CSS scroll snap, no JS); a grid from lg up. */}
            <ul
                role="list"
                className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] lg:gap-4 lg:overflow-visible lg:px-0"
            >
                {withProducts.map((category, index) => (
                    <li
                        key={category.slug}
                        className="w-[72%] shrink-0 snap-start animate-rise motion-reduce:animate-none sm:w-[44%] lg:w-auto"
                        style={{ animationDelay: `${360 + index * 70}ms` }}
                    >
                        <Link
                            href={getCategoryHref(category.slug)}
                            className="group flex h-full flex-col rounded-3xl border border-cellar-ink/10 bg-cellar-raised/60 p-5 backdrop-blur-sm transition-[transform,border-color,background-color] duration-300 ease-cellar hover:-translate-y-0.5 hover:border-champagne-soft/50 hover:bg-cellar-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                            <span className="flex items-start justify-between gap-3">
                                <span className="font-display text-[1.6rem] font-medium leading-tight tracking-[-0.02em] text-cellar-ink">
                                    {category.name}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-cellar-ink/15 text-cellar-ink transition-colors duration-300 group-hover:border-champagne-soft group-hover:bg-champagne-soft group-hover:text-cellar"
                                >
                                    <ArrowUpRight size={16} strokeWidth={1.8} />
                                </span>
                            </span>
                            {category.description && (
                                <span className="mt-2 line-clamp-2 text-sm leading-6 text-cellar-muted">
                                    {category.description}
                                </span>
                            )}
                            <span className="mt-auto pt-4 text-xs font-semibold text-champagne-soft">
                                {getProductCountLabel(productCounts.get(category.slug) ?? 0)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
