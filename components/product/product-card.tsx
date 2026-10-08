import Link from "next/link";
import { ArrowRight, Layers, Thermometer, Wine } from "lucide-react";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ProductImage } from "@/components/product/product-image";
import { ProductPrice } from "@/components/product/product-price";
import { StockBadge } from "@/components/product/stock-badge";
import {
    getDiscountPercentage,
    getProductImageAlt,
    getTemperatureLabel,
    getZonesLabel,
    installationTypeLabels,
} from "@/lib/product-display";
import { getProductHref } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

type ProductCardProps = {
    product: WineCellarProduct;
    imageSizes?: string;
    headingLevel?: "h2" | "h3";
};

const defaultImageSizes =
    "(min-width: 1440px) 440px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 82vw";

export function ProductCard({
    product,
    imageSizes = defaultImageSizes,
    headingLevel: Heading = "h3",
}: ProductCardProps) {
    const href = getProductHref(product);
    const discount = getDiscountPercentage(product);
    const temperature = getTemperatureLabel(product.temperatureRanges);

    const specs = [
        {
            label: "Capacidade",
            value: `${product.capacity} garrafas`,
            icon: Wine,
        },
        {
            label: "Zonas",
            value: getZonesLabel(product.zones),
            icon: Layers,
        },
        ...(temperature
            ? [
                  {
                      label: "Temperatura",
                      value: temperature,
                      icon: Thermometer,
                  },
              ]
            : []),
    ];

    return (
        <article className="group relative flex h-full flex-col rounded-3xl border border-charcoal/8 bg-surface p-2 shadow-card transition-[transform,box-shadow,border-color] duration-500 ease-cellar focus-within:-translate-y-1 focus-within:shadow-lift hover:-translate-y-1 hover:border-champagne/40 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0">
            <div className="relative aspect-4/5 overflow-hidden rounded-[1.25rem] bg-surface-muted">
                <ProductImage
                    src={product.images[0]}
                    alt={getProductImageAlt(product)}
                    sizes={imageSizes}
                    className="transition-transform duration-700 ease-cellar group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                <div className="absolute right-3 top-3">
                    <FavoriteButton productId={product.id} productName={product.name} />
                </div>

                {discount !== null && (
                    <span className="absolute left-3 top-3 rounded-full bg-wine px-3 py-1 text-xs font-bold text-white">
                        <span className="sr-only">Desconto de </span>-{discount}%
                    </span>
                )}

                {/* Hover hint only: the whole card is already the link. */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 rounded-full bg-cellar/85 py-3 text-sm font-semibold text-cellar-ink opacity-0 backdrop-blur-md transition-[opacity,transform] duration-300 ease-cellar translate-y-2 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:flex"
                >
                    Ver detalhes
                    <ArrowRight size={16} strokeWidth={1.8} />
                </span>
            </div>

            <div className="flex flex-1 flex-col px-3 pb-3 pt-5 sm:px-4 sm:pb-4">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-champagne-ink">
                    {product.brand}
                </p>

                <Heading className="mt-1.5 font-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-charcoal">
                    <Link
                        href={href}
                        className="rounded-sm after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-wine focus-visible:after:ring-offset-2"
                    >
                        {product.name}
                    </Link>
                </Heading>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {product.shortDescription}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-2">
                    {specs.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="min-w-0 rounded-2xl bg-background px-3 py-2.5">
                            <dt className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
                                <Icon
                                    size={13}
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                    className="shrink-0 text-wine"
                                />
                                {label}
                            </dt>

                            <dd className="mt-1 truncate text-sm font-semibold text-charcoal">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>

                <p className="mt-3 text-xs font-medium text-muted">
                    {installationTypeLabels[product.installationType]}
                </p>

                <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-4">
                    <div className="space-y-1.5">
                        <ProductPrice
                            price={product.price}
                            compareAtPrice={product.compareAtPrice}
                        />

                        <StockBadge status={product.stockStatus} />
                    </div>

                    <span
                        aria-hidden="true"
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-charcoal transition-colors duration-300 group-hover:border-wine group-hover:bg-wine group-hover:text-white"
                    >
                        <ArrowRight size={18} strokeWidth={1.8} />
                    </span>
                </div>
            </div>
        </article>
    );
}
