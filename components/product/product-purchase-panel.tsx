import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { getFactIcon } from "@/components/product/fact-icons";
import { ProductPrice } from "@/components/product/product-price";
import { StockBadge } from "@/components/product/stock-badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { getMaxPurchasableQuantity } from "@/lib/cart/availability";
import {
    getDiscountPercentage,
    getProductFacts,
    installationTypeLabels,
    productKindLabels,
} from "@/lib/product-display";
import { getBrandHref, getProductHref } from "@/lib/routes";
import type { Product } from "@/types/product";

type ProductPurchasePanelProps = {
    product: Product;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
    const discount = getDiscountPercentage(product);
    // Reservations are taken for wine cellars only (see /reservas).
    const reservable = product.kind === "wine-cellar";
    const keySpecs = getProductFacts(product).map((fact) => ({ ...fact, icon: getFactIcon(fact.label) }));

    return (
        <div>
            <Link
                href={getBrandHref(product.brandSlug)}
                className="inline-flex items-center gap-3 rounded-sm text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-champagne-ink transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                <span aria-hidden="true" className="h-px w-7 bg-champagne" />
                {product.brand}
            </Link>

            <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="text-balance font-display text-[2.75rem] font-medium leading-[0.95] tracking-[-0.04em] text-charcoal sm:text-6xl">
                    {product.name}
                </h1>
                <FavoriteButton productId={product.id} productName={product.name} variant="inline" />
            </div>

            <p className="mt-3 text-xs font-medium text-muted">
                Ref. {product.sku} ·{" "}
                {product.kind === "wine-cellar"
                    ? installationTypeLabels[product.installationType]
                    : productKindLabels[product.kind].singular}
            </p>

            <p className="mt-5 text-base leading-7 text-muted">
                {product.shortDescription}
            </p>

            {keySpecs.length > 0 && (
            <dl className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
                {keySpecs.map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-charcoal/8 bg-surface px-3 py-4 shadow-card sm:px-4"
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
            )}

            <div className="mt-7 rounded-3xl border border-charcoal/8 bg-surface p-5 shadow-lift sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ProductPrice
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                        size="lg"
                    />

                    {discount !== null && (
                        <span className="rounded-full bg-wine px-3 py-1 text-xs font-bold text-white">
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
                            reservable && product.stockStatus === "preorder"
                                ? "Disponível por reserva"
                                : "Esgotado"
                        }
                    />

                    {reservable && (
                        <Link
                            href={`${getProductHref(product)}/reservar`}
                            className={buttonStyles({ variant: "secondary", block: true })}
                        >
                            <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
                            Reservar
                        </Link>
                    )}
                </div>

                {reservable && (
                    <p className="mt-4 text-center text-xs text-muted">
                        Reserve sem pagamento imediato. Confirmamos a disponibilidade consigo.
                    </p>
                )}
            </div>
        </div>
    );
}
