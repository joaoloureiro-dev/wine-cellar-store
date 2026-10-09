import { ProductImage } from "@/components/product/product-image";
import type { Cart } from "@/lib/cart/cart";
import { formatCurrency } from "@/lib/format";
import { getProductImageAlt } from "@/lib/product-display";

type OrderSummaryProps = {
    cart: Cart;
    shippingCents: number;
};

export function OrderSummary({ cart, shippingCents }: OrderSummaryProps) {
    const totalCents = cart.subtotalCents + shippingCents;

    return (
        <div>
            <ul role="list" className="divide-y divide-border">
                {cart.items.map((item) => (
                    <li key={item.product.id} className="flex gap-4 py-4 first:pt-0">
                        <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                            <ProductImage
                                src={item.product.images[0]}
                                alt={getProductImageAlt(item.product)}
                                sizes="56px"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-champagne-ink">
                                {item.product.brand}
                            </p>
                            <p className="truncate text-sm font-semibold text-charcoal">
                                {item.product.name}
                            </p>
                            <p className="text-xs text-muted">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-charcoal">
                            {formatCurrency(item.lineTotalCents / 100)}
                        </p>
                    </li>
                ))}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-semibold text-charcoal">
                        {formatCurrency(cart.subtotalCents / 100)}
                    </dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted">Envio</dt>
                    <dd className="font-semibold text-charcoal">
                        {shippingCents === 0 ? "Grátis" : formatCurrency(shippingCents / 100)}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                    <dt className="font-semibold text-charcoal">Total</dt>
                    <dd className="text-2xl font-semibold tabular-nums tracking-tight text-charcoal">
                        {formatCurrency(totalCents / 100)}
                    </dd>
                </div>
            </dl>
            <p className="mt-1 text-right text-xs text-muted">IVA incluído</p>
        </div>
    );
}
