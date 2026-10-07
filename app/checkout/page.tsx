import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { ShieldCheck } from "lucide-react";

import { CheckoutForm, type ShippingOption } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container } from "@/components/layout/container";
import { getDefaultAddress } from "@/lib/account/queries";
import { getSession } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/get-cart";
import {
    calculateShippingCents,
    DEFAULT_SHIPPING_METHOD,
    getShippingMethod,
    shippingMethods,
} from "@/lib/checkout/shipping";
import { formatCurrency } from "@/lib/format";
import { getAvailablePaymentMethods, getBankTransferDetails } from "@/lib/payments/config";

/** Per-request page (session, cookies or private data): rendered on demand. */
export const instant = false;

export const metadata: Metadata = {
    title: "Checkout",
    robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
    const cart = await getCart();

    // The cart page explains empty carts and stock issues; checkout needs a
    // valid cart. Final stock checks still happen when the order is placed.
    if (cart.items.length === 0 || cart.hasIssues) {
        redirect("/carrinho");
    }

    const shippingOptions: ShippingOption[] = shippingMethods.map((method) => ({
        id: method.id,
        label: method.label,
        description: method.description,
        priceCents: calculateShippingCents(method, cart.subtotalCents),
    }));

    const defaultShippingCents = calculateShippingCents(
        getShippingMethod(DEFAULT_SHIPPING_METHOD)!,
        cart.subtotalCents,
    );

    const availablePaymentMethods = getAvailablePaymentMethods(
        cart.subtotalCents + defaultShippingCents,
    );

    const session = await getSession();
    const address = session ? await getDefaultAddress(session.user.id) : null;
    const defaults = session
        ? {
              name: address?.recipientName ?? session.user.name,
              email: session.user.email,
              phone: address?.phone,
              addressLine1: address?.addressLine1,
              addressLine2: address?.addressLine2 ?? undefined,
              postalCode: address?.postalCode,
              city: address?.city,
          }
        : undefined;

    const summary = <OrderSummary cart={cart} shippingCents={defaultShippingCents} />;

    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">
                    Checkout
                </h1>

                <details className="group mt-6 rounded-xl border border-border bg-surface lg:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-semibold text-charcoal [&::-webkit-details-marker]:hidden">
                        <span>
                            Resumo da encomenda
                            <span className="ml-1 font-normal text-muted group-open:hidden">(mostrar)</span>
                            <span className="ml-1 hidden font-normal text-muted group-open:inline">(ocultar)</span>
                        </span>
                        <span>{formatCurrency((cart.subtotalCents + defaultShippingCents) / 100)}</span>
                    </summary>
                    <div className="border-t border-border p-4">{summary}</div>
                </details>

                <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
                    {availablePaymentMethods.length > 0 ? (
                        <CheckoutForm
                            idempotencyKey={randomUUID()}
                            shippingOptions={shippingOptions}
                            availablePaymentMethods={availablePaymentMethods}
                            bankTransfer={getBankTransferDetails()}
                            defaults={defaults}
                            isSignedIn={Boolean(session)}
                        />
                    ) : (
                        <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm leading-6 text-charcoal">
                            De momento não é possível concluir encomendas online. Contacte-nos ou
                            faça uma reserva na página do produto.
                        </p>
                    )}

                    <aside aria-label="Resumo da encomenda" className="hidden lg:block">
                        <div className="sticky top-6 rounded-xl border border-border bg-surface p-6">
                            <h2 className="font-display text-2xl font-semibold text-charcoal">Resumo</h2>
                            <div className="mt-5">{summary}</div>
                            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted">
                                <ShieldCheck size={16} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-wine" />
                                Os preços e o stock são confirmados no momento da encomenda.
                            </p>
                        </div>
                    </aside>
                </div>
            </Container>
        </main>
    );
}
