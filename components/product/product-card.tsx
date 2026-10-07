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
        <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-300 focus-within:shadow-lg hover:shadow-lg">
            <div className="relative aspect-4/5 overflow-hidden bg-surface-muted">
                <ProductImage
                    src={product.images[0]}
                    alt={getProductImageAlt(product)}
                    sizes={imageSizes}
                    className="transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                <div className="absolute right-3 top-3">
                    <FavoriteButton productId={product.id} productName={product.name} />
                </div>

                {discount !== null && (
                    <span className="absolute left-4 top-4 rounded-sm bg-wine px-2.5 py-1 text-xs font-bold text-white">
                        <span className="sr-only">Desconto de </span>-{discount}%
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-wine">
                    {product.brand}
                </p>

                <Heading className="mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-charcoal sm:text-[1.7rem]">
                    <Link
                        href={href}
                        className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-wine focus-visible:after:ring-offset-2"
                    >
                        {product.name}
                    </Link>
                </Heading>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {product.shortDescription}
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-border py-4">
                    {specs.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="min-w-0">
                            <dt className="flex flex-col gap-1.5 text-xs text-muted">
                                <Icon
                                    size={16}
                                    strokeWidth={1.6}
                                    aria-hidden="true"
                                    className="shrink-0 text-wine"
                                />
                                {label}
                            </dt>

                            <dd className="mt-1.5 text-sm font-semibold text-charcoal">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>

                <p className="mt-4 text-xs font-medium text-muted">
                    {installationTypeLabels[product.installationType]}
                </p>

                <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                    <div className="space-y-2">
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
