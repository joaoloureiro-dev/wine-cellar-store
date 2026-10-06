import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { ReservationCreatedToast } from "@/components/reservations/reservation-created-toast";
import { ReservationSteps } from "@/components/reservations/reservation-steps";
import { formatCurrency } from "@/lib/format";
import { getPublicReservation } from "@/lib/reservations/service";
import { reservationStatusLabels } from "@/lib/reservations/status";
import { getProductHref } from "@/lib/routes";

export const metadata: Metadata = {
    title: "Reserva",
    robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
});

export default async function ReservationPage(props: PageProps<"/reservas/[reference]">) {
    const [{ reference }, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
    ]);
    const reservation = await getPublicReservation(reference);

    if (!reservation) {
        notFound();
    }

    const { product } = reservation;
    const productHref = getProductHref({ brandSlug: product.brand.slug, slug: product.slug });
    const isNew = searchParams.nova === "1";

    return (
        <main>
            {isNew && <ReservationCreatedToast reference={reservation.reference} />}

            <Container className="py-10 sm:py-14 lg:py-20">
                <div className="mx-auto max-w-2xl">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-champagne" />
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine">
                            Reserva {reservation.reference}
                        </span>
                    </div>

                    <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">
                        {reservation.status === "PENDING" ? "Pedido de reserva recebido" : "A sua reserva"}
                    </h1>

                    <p className="mt-4 text-base leading-7 text-muted">
                        Guarde a referência <strong className="text-charcoal">{reservation.reference}</strong>.
                        Vamos contactá-lo para confirmar a disponibilidade e as condições.
                    </p>

                    <section
                        aria-label="Detalhes da reserva"
                        className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6"
                    >
                        <div className="flex gap-5">
                            <div className="relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                                <ProductImage
                                    src={product.images[0]?.url}
                                    alt={`Cave de vinho ${product.brand.name} ${product.name}`}
                                    sizes="80px"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine">
                                    {product.brand.name}
                                </p>
                                <Link
                                    href={productHref}
                                    className="mt-1 block rounded-sm font-display text-2xl font-semibold leading-tight text-charcoal hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                                >
                                    {product.name}
                                </Link>
                            </div>
                        </div>

                        <dl className="mt-6 divide-y divide-border border-t border-border text-sm">
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="text-muted">Estado</dt>
                                <dd className="inline-flex items-center gap-2 font-semibold text-charcoal">
                                    <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" className="text-wine" />
                                    {reservationStatusLabels[reservation.status]}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="text-muted">Quantidade</dt>
                                <dd className="font-semibold text-charcoal">{reservation.quantity}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="text-muted">Preço unitário reservado</dt>
                                <dd className="font-semibold text-charcoal">
                                    {formatCurrency(reservation.unitPriceCents / 100)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="text-muted">Pedido em</dt>
                                <dd className="text-right font-semibold text-charcoal">
                                    {dateFormatter.format(reservation.createdAt)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section aria-labelledby="next-steps-heading" className="mt-10">
                        <h2
                            id="next-steps-heading"
                            className="font-display text-2xl font-semibold text-charcoal"
                        >
                            Próximos passos
                        </h2>
                        <div className="mt-5">
                            <ReservationSteps />
                        </div>
                    </section>

                    <Link
                        href="/caves"
                        className="mt-10 inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        Continuar a explorar
                    </Link>
                </div>
            </Container>
        </main>
    );
}
