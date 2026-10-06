import Link from "next/link";
import { CalendarClock, Layers, ShoppingBag, Thermometer, Wine } from "lucide-react";

import { ProductPrice } from "@/components/product/product-price";
import { StockBadge } from "@/components/product/stock-badge";
import {
    getDiscountPercentage,
    getTemperatureLabel,
    getZonesLabel,
    installationTypeLabels,
} from "@/lib/product-display";
import { getBrandHref } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

type ProductPurchasePanelProps = {
    product: WineCellarProduct;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
    const discount = getDiscountPercentage(product);
    const temperature = getTemperatureLabel(product.temperatureRanges);
    const canBuy =
        product.stockStatus === "in_stock" || product.stockStatus === "low_stock";

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
                href={getBrandHref(product.brand)}
                className="rounded-sm text-xs font-bold uppercase tracking-[0.18em] text-wine transition-colors hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                {product.brand}
            </Link>

            <h1 className="mt-3 font-display text-4xl font-medium leading-none tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-6xl">
                {product.name}
            </h1>

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

                {/*
                  Cart and reservations are implemented in the next stages.
                  The buttons are rendered disabled (not hidden) so the final
                  layout is already in place.
                */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        disabled
                        aria-describedby="purchase-availability-note"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-wine"
                    >
                        <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
                        {canBuy ? "Adicionar ao carrinho" : "Indisponível"}
                    </button>

                    <button
                        type="button"
                        disabled
                        aria-describedby="purchase-availability-note"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-charcoal px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                        <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
                        Reservar
                    </button>
                </div>

                <p id="purchase-availability-note" className="mt-3 text-xs text-muted">
                    Compra online e reservas disponíveis brevemente.
                </p>
            </div>
        </div>
    );
}
