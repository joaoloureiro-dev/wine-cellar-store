import Link from "next/link";
import { Lock } from "lucide-react";

import type { Cart } from "@/lib/cart/cart";
import { formatCurrency } from "@/lib/format";

type CartSummaryProps = {
    cart: Cart;
};

export function CartSummary({ cart }: CartSummaryProps) {
    return (
        <section
            aria-labelledby="cart-summary-heading"
            className="rounded-xl border border-border bg-surface p-5 sm:p-6"
        >
            <h2
                id="cart-summary-heading"
                className="font-display text-2xl font-semibold text-charcoal"
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
                    <dd className="text-2xl font-semibold tracking-tight text-charcoal">
                        {formatCurrency(cart.subtotalCents / 100)}
                    </dd>
                </div>
            </dl>

            <p className="mt-1 text-right text-xs text-muted">IVA incluído</p>

            {cart.hasIssues && (
                <p role="status" className="mt-5 rounded-md bg-warning/10 px-3 py-2.5 text-xs font-medium text-warning">
                    Resolva os avisos do carrinho antes de continuar.
                </p>
            )}

            {cart.hasIssues ? (
                <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                    Finalizar compra
                </button>
            ) : (
                <Link
                    href="/checkout"
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                    Finalizar compra
                </Link>
            )}

            <Link
                href="/caves"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                Continuar a comprar
            </Link>
        </section>
    );
}
