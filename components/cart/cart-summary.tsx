import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonStyles } from "@/components/ui/button-styles";
import type { Cart } from "@/lib/cart/cart";
import { formatCurrency } from "@/lib/format";

type CartSummaryProps = {
    cart: Cart;
};

export function CartSummary({ cart }: CartSummaryProps) {
    return (
        <section
            aria-labelledby="cart-summary-heading"
            className="rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-lift sm:p-7"
        >
            <h2
                id="cart-summary-heading"
                className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal"
            >
                Resumo
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-semibold text-charcoal">
                        {formatCurrency(cart.subtotalCents / 100)}
                    </dd>
                </div>

                {cart.savingsCents > 0 && (
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted">Poupança incluída</dt>
                        <dd className="font-semibold text-success">
                            −{formatCurrency(cart.savingsCents / 100)}
                        </dd>
                    </div>
                )}

                <div className="flex justify-between gap-4">
                    <dt className="text-muted">Envio</dt>
                    <dd className="text-right text-charcoal">Calculado no checkout</dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                    <dt className="font-semibold text-charcoal">Total estimado</dt>
                    <dd className="text-2xl font-semibold tabular-nums tracking-tight text-charcoal">
                        {formatCurrency(cart.subtotalCents / 100)}
                    </dd>
                </div>
            </dl>

            <p className="mt-1 text-right text-xs text-muted">IVA incluído</p>

            {cart.hasIssues && (
                <p role="status" className="mt-5 rounded-2xl bg-warning/10 px-4 py-3 text-xs font-medium text-warning">
                    Resolva os avisos do carrinho antes de continuar.
                </p>
            )}

            {cart.hasIssues ? (
                <button
                    type="button"
                    disabled
                    className={buttonStyles({ block: true, className: "mt-6 disabled:cursor-not-allowed" })}
                >
                    <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                    Finalizar compra
                </button>
            ) : (
                <Link
                    href="/checkout"
                    className={buttonStyles({ block: true, className: "mt-6" })}
                >
                    <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                    Finalizar compra
                </Link>
            )}

            <Link
                href="/caves"
                className={buttonStyles({ variant: "secondary", block: true, className: "mt-3" })}
            >
                Continuar a comprar
            </Link>
        </section>
    );
}
