import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, TriangleAlert } from "lucide-react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonStyles } from "@/components/ui/button-styles";
import { getCart } from "@/lib/cart/get-cart";

/** Per-request page (session, cookies or private data): rendered on demand. */
export const instant = false;

export const metadata: Metadata = {
    title: "Carrinho",
    robots: { index: false, follow: false },
};

export default async function CartPage() {
    const cart = await getCart();
    const isEmpty = cart.items.length === 0;

    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <Breadcrumbs
                    items={[{ label: "Início", href: "/" }, { label: "Carrinho" }]}
                />

                <div className="mt-8 flex items-end justify-between gap-4 sm:mt-10">
                    <h1 className="font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] text-charcoal sm:text-6xl">
                        Carrinho
                    </h1>

                    {!isEmpty && (
                        <p className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-charcoal">
                            {cart.itemCount} {cart.itemCount === 1 ? "artigo" : "artigos"}
                        </p>
                    )}
                </div>

                {cart.missingProductCount > 0 && (
                    <p
                        role="status"
                        className="mt-6 flex items-start gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning"
                    >
                        <TriangleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="mt-px shrink-0" />
                        Alguns produtos deixaram de estar disponíveis e foram retirados da
                        lista.
                    </p>
                )}

                {isEmpty ? (
                    <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-16 text-center sm:py-24">
                        <span className="inline-flex size-16 items-center justify-center rounded-full bg-wine-light text-wine">
                            <ShoppingBag size={28} strokeWidth={1.4} aria-hidden="true" />
                        </span>

                        <h2 className="mt-6 font-display text-3xl font-medium tracking-[-0.02em] text-charcoal">
                            O seu carrinho está vazio
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                            Explore o catálogo e encontre a cave certa para a sua coleção.
                        </p>

                        <Link
                            href="/caves"
                            className={buttonStyles({ className: "mt-8" })}
                        >
                            Explorar caves
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-10">
                        <ul role="list" className="divide-y divide-border self-start rounded-3xl border border-charcoal/8 bg-surface px-4 shadow-card sm:px-6">
                            {cart.items.map((item) => (
                                <li key={item.product.id}>
                                    <CartLineItem item={item} />
                                </li>
                            ))}
                        </ul>

                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <CartSummary cart={cart} />
                        </div>
                    </div>
                )}
            </Container>
        </main>
    );
}
