import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, TriangleAlert } from "lucide-react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
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

                <div className="mt-6 flex items-baseline justify-between gap-4 sm:mt-8">
                    <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">
                        Carrinho
                    </h1>

                    {!isEmpty && (
                        <p className="text-sm font-medium text-muted">
                            {cart.itemCount} {cart.itemCount === 1 ? "artigo" : "artigos"}
                        </p>
                    )}
                </div>

                {cart.missingProductCount > 0 && (
                    <p
                        role="status"
                        className="mt-6 flex items-start gap-2 rounded-md bg-warning/10 px-4 py-3 text-sm text-warning"
                    >
                        <TriangleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="mt-px shrink-0" />
                        Alguns produtos deixaram de estar disponíveis e foram retirados da
                        lista.
                    </p>
                )}

                {isEmpty ? (
                    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
                        <ShoppingBag size={32} strokeWidth={1.3} aria-hidden="true" className="text-wine" />

                        <h2 className="mt-4 font-display text-2xl font-semibold text-charcoal">
                            O seu carrinho está vazio
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                            Explore o catálogo e encontre a cave certa para a sua coleção.
                        </p>

                        <Link
                            href="/caves"
                            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                        >
                            Explorar caves
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
                        <ul role="list" className="divide-y divide-border border-y border-border">
                            {cart.items.map((item) => (
                                <li key={item.product.id}>
                                    <CartLineItem item={item} />
                                </li>
                            ))}
                        </ul>

                        <div className="lg:sticky lg:top-6 lg:self-start">
                            <CartSummary cart={cart} />
                        </div>
                    </div>
                )}
            </Container>
        </main>
    );
}
