import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { CartItemControls } from "@/components/cart/cart-item-controls";
import { ProductImage } from "@/components/product/product-image";
import type { CartItem } from "@/lib/cart/cart";
import { getUnavailableMessage } from "@/lib/cart/availability";
import { formatCurrency } from "@/lib/format";
import { getProductImageAlt, getZonesLabel } from "@/lib/product-display";
import { getProductHref } from "@/lib/routes";

type CartLineItemProps = {
    item: CartItem;
};

export function CartLineItem({ item }: CartLineItemProps) {
    const { product } = item;
    const href = getProductHref(product);

    return (
        <article className="flex gap-4 py-6 sm:gap-6">
            <Link
                href={href}
                tabIndex={-1}
                aria-hidden="true"
                className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-muted sm:w-28"
            >
                <ProductImage
                    src={product.images[0]}
                    alt={getProductImageAlt(product)}
                    sizes="112px"
                />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-champagne-ink">
                            {product.brand}
                        </p>

                        <h2 className="mt-1 font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
                            <Link
                                href={href}
                                className="rounded-sm transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                            >
                                {product.name}
                            </Link>
                        </h2>

                        <p className="mt-1 text-xs text-muted">
                            {product.capacity} garrafas · {getZonesLabel(product.zones)} ·{" "}
                            {formatCurrency(item.unitPriceCents / 100)} / un.
                        </p>
                    </div>

                    <p className="text-base font-semibold tabular-nums text-charcoal sm:text-right">
                        <span className="sr-only">Total da linha: </span>
                        {formatCurrency(item.lineTotalCents / 100)}
                    </p>
                </div>

                {item.issue && (
                    <p className="mt-3 flex items-start gap-2 text-xs font-medium text-warning">
                        <TriangleAlert
                            size={15}
                            strokeWidth={1.8}
                            aria-hidden="true"
                            className="mt-px shrink-0"
                        />
                        {item.issue === "unavailable"
                            ? `${getUnavailableMessage(product)} Remova-o para continuar.`
                            : `Só temos ${item.maxQuantity} ${item.maxQuantity === 1 ? "unidade disponível" : "unidades disponíveis"}.`}
                    </p>
                )}

                <div className="mt-4 sm:mt-auto sm:pt-4">
                    <CartItemControls
                        productId={product.id}
                        productName={product.name}
                        quantity={item.quantity}
                        maxQuantity={item.maxQuantity}
                    />
                </div>
            </div>
        </article>
    );
}
