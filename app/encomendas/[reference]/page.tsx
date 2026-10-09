import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderPlacedEffects } from "@/components/checkout/order-placed-effects";
import { PaymentInstructions } from "@/components/payments/payment-instructions";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProductImage } from "@/components/product/product-image";
import { formatCurrency } from "@/lib/format";
import { getPublicOrder } from "@/lib/orders/service";
import { orderStatusLabels } from "@/lib/orders/status";
import { getBankTransferDetails } from "@/lib/payments/config";
import { getOrderPaymentView } from "@/lib/payments/service";
import { getProductHref } from "@/lib/routes";

/** Per-request page (session, cookies or private data): rendered on demand. */
export const instant = false;

export const metadata: Metadata = {
    title: "Encomenda",
    robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
});

export default async function OrderPage(props: PageProps<"/encomendas/[reference]">) {
    const [{ reference }, searchParams] = await Promise.all([props.params, props.searchParams]);
    const order = await getPublicOrder(reference);

    if (!order) {
        notFound();
    }

    const isAwaitingPayment = order.status === "AWAITING_PAYMENT";
    const paymentView = await getOrderPaymentView(order.reference);

    return (
        <main>
            {searchParams.nova === "1" && <OrderPlacedEffects reference={order.reference} />}

            <Container className="py-10 sm:py-14 lg:py-20">
                <div className="mx-auto max-w-2xl">
                    <Eyebrow>Encomenda {order.reference}</Eyebrow>

                    <h1 className="mt-4 text-balance font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] text-charcoal sm:text-6xl">
                        {isAwaitingPayment ? "Obrigado pela sua encomenda" : "A sua encomenda"}
                    </h1>

                    <p className="mt-4 text-base leading-7 text-muted">
                        Guarde a referência <strong className="text-charcoal">{order.reference}</strong>.
                        {isAwaitingPayment
                            ? " Os artigos estão reservados para si enquanto aguardamos o pagamento."
                            : null}
                    </p>

                    {paymentView && (
                        <div className="mt-8">
                            <PaymentInstructions
                                reference={order.reference}
                                view={paymentView}
                                bankTransfer={getBankTransferDetails()}
                                returnState={typeof searchParams.pagamento === "string" ? searchParams.pagamento : undefined}
                            />
                        </div>
                    )}

                    <section aria-label="Detalhes da encomenda" className="mt-8 rounded-3xl border border-charcoal/8 bg-surface p-5 shadow-card sm:p-7">
                        <ul role="list" className="divide-y divide-border">
                            {order.items.map((item) => (
                                <li key={item.productName} className="flex gap-4 py-4 first:pt-0">
                                    <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
                                        <ProductImage
                                            src={item.product.images[0]?.url}
                                            alt={`Cave de vinho ${item.product.brand.name} ${item.productName}`}
                                            sizes="64px"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-champagne-ink">
                                            {item.product.brand.name}
                                        </p>
                                        <Link
                                            href={getProductHref({ brandSlug: item.product.brand.slug, slug: item.product.slug })}
                                            className="text-sm font-semibold text-charcoal hover:text-wine"
                                        >
                                            {item.productName}
                                        </Link>
                                        <p className="text-xs text-muted">
                                            {item.quantity} × {formatCurrency(item.unitPriceCents / 100)}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-charcoal">
                                        {formatCurrency(item.lineTotalCents / 100)}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <dl className="mt-2 space-y-2.5 border-t border-border pt-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Estado</dt>
                                <dd><span className="rounded-full bg-wine-light px-3 py-1 text-xs font-semibold text-wine-dark">{orderStatusLabels[order.status]}</span></dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Subtotal</dt>
                                <dd className="font-semibold text-charcoal">{formatCurrency(order.subtotalCents / 100)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Envio</dt>
                                <dd className="font-semibold text-charcoal">
                                    {order.shippingCents === 0 ? "Grátis" : formatCurrency(order.shippingCents / 100)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                                <dt className="font-semibold text-charcoal">Total</dt>
                                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-charcoal">
                                    {formatCurrency(order.totalCents / 100)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 text-xs">
                                <dt className="text-muted">Encomenda feita em</dt>
                                <dd className="text-muted">{dateFormatter.format(order.createdAt)}</dd>
                            </div>
                        </dl>
                    </section>

                    <Link
                        href="/caves"
                        className="mt-10 inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        Continuar a explorar
                    </Link>
                </div>
            </Container>
        </main>
    );
}
