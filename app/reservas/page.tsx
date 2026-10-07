import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/catalog/page-intro";
import { Container } from "@/components/layout/container";
import { ReservationSteps } from "@/components/reservations/reservation-steps";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
    title: "Reservas",
    description:
        "Reserve a sua cave de vinho sem pagamento imediato. Confirmamos a disponibilidade, o prazo e as condições consigo.",
    path: "/reservas",
});

export default function ReservationsPage() {
    return (
        <main>
            <PageIntro
                breadcrumbs={[{ label: "Início", href: "/" }, { label: "Reservas" }]}
                eyebrow="Reservas"
                title="Reserve a sua cave"
                description="Garanta o modelo que procura sem pagamento imediato. Ideal para modelos com stock limitado, disponíveis por encomenda ou para quando precisa de tempo para preparar a instalação."
            />

            <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
                <section aria-labelledby="how-it-works-heading">
                    <h2
                        id="how-it-works-heading"
                        className="font-display text-3xl font-medium tracking-[-0.03em] text-charcoal"
                    >
                        Como funciona
                    </h2>
                    <div className="mt-6">
                        <ReservationSteps />
                    </div>
                </section>

                <section
                    aria-labelledby="start-reservation-heading"
                    className="rounded-xl border border-border bg-surface p-6 sm:p-8"
                >
                    <h2
                        id="start-reservation-heading"
                        className="font-display text-2xl font-semibold text-charcoal"
                    >
                        Fazer uma reserva
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted">
                        Escolha a cave no catálogo e use o botão «Reservar» na página do
                        produto. Recebe uma referência para acompanhar o pedido.
                    </p>
                    <Link
                        href="/caves"
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        Ver caves de vinho
                    </Link>
                </section>
            </Container>
        </main>
    );
}
