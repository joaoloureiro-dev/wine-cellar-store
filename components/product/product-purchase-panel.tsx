import Link from "next/link";
import { CalendarClock, Layers, Thermometer, Wine } from "lucide-react";

import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ProductPrice } from "@/components/product/product-price";
import { StockBadge } from "@/components/product/stock-badge";
import { getMaxPurchasableQuantity } from "@/lib/cart/availability";
import {
    getDiscountPercentage,
    getTemperatureLabel,
    getZonesLabel,
    installationTypeLabels,
} from "@/lib/product-display";
import { getBrandHref, getProductHref } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

type ProductPurchasePanelProps = {
    product: WineCellarProduct;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
    const discount = getDiscountPercentage(product);
    const temperature = getTemperatureLabel(product.temperatureRanges);

    const keySpecs = [
        { label: "Capacidade", value: `${product.capacity} garrafas`, icon: Wine },
        { label: "Zonas", value: getZonesLabel(product.zones), icon: Layers },
        ...(temperature
            ? [{ label: "Temperatura", value: temperature, icon: Thermometer }]
            : []),
    ];

    return (
        <div>
            <Link
                href={getBrandHref(product.brandSlug)}
                className="rounded-sm text-xs font-bold uppercase tracking-[0.18em] text-wine transition-colors hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                {product.brand}
            </Link>

            <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="font-display text-4xl font-medium leading-none tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-6xl">
                    {product.name}
                </h1>
                <FavoriteButton productId={product.id} productName={product.name} variant="inline" />
            </div>

            <p className="mt-3 text-xs font-medium text-muted">
                Ref. {product.sku} · {installationTypeLabels[product.installationType]}
            </p>

            <p className="mt-6 text-base leading-7 text-muted">
                {product.shortDescription}
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-3">
                {keySpecs.map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="rounded-lg border border-border bg-surface px-3 py-4 sm:px-4"
                    >
                        <dt className="flex flex-col gap-2 text-xs text-muted">
                            <Icon
                                size={18}
                                strokeWidth={1.6}
                                aria-hidden="true"
                                className="text-wine"
                            />
                            {label}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-charcoal sm:text-base">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ProductPrice
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                        size="lg"
                    />

                    {discount !== null && (
                        <span className="rounded-sm bg-wine px-2.5 py-1 text-xs font-bold text-white">
                            <span className="sr-only">Desconto de </span>-{discount}%
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs text-muted">IVA incluído</p>

                <div className="mt-4">
                    <StockBadge status={product.stockStatus} />
                </div>

                <div className="mt-6 space-y-3">
                    <AddToCartForm
                        productId={product.id}
                        productName={product.name}
                        maxQuantity={getMaxPurchasableQuantity(product)}
                        unavailableLabel={
                            product.stockStatus === "preorder"
                                ? "Disponível por reserva"
                                : "Esgotado"
                        }
                    />

                    <Link
                        href={`${getProductHref(product)}/reservar`}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-charcoal px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
                        Reservar
                    </Link>
                </div>

                <p className="mt-3 text-xs text-muted">
                    Reserve sem pagamento imediato. Confirmamos a disponibilidade consigo.
                </p>
            </div>
        </div>
    );
}
