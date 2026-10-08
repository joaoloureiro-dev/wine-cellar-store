import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ReservationSteps } from "@/components/reservations/reservation-steps";
import { buttonArrowStyles, buttonStyles } from "@/components/ui/button-styles";
import { SectionHeading } from "@/components/ui/section-heading";

export function ReservationCta() {
    return (
        <section aria-labelledby="reservation-cta-heading" className="pb-16 sm:pb-20 lg:pb-28">
            <Container>
                <div className="reveal grid gap-10 overflow-hidden rounded-[2rem] border border-charcoal/8 bg-surface p-6 shadow-card sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:p-16">
                    <div>
                        <SectionHeading
                            id="reservation-cta-heading"
                            eyebrow="Reservas"
                            title="Reserve hoje. Pague depois de confirmarmos."
                            description="Garanta o modelo que procura sem pagamento imediato. Ideal para modelos com stock limitado ou para quando precisa de tempo para preparar a instalação."
                        />

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/caves" className={buttonStyles()}>
                                Escolher uma cave
                                <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className={buttonArrowStyles} />
                            </Link>
                            <Link href="/reservas" className={buttonStyles({ variant: "secondary" })}>
                                Como funcionam as reservas
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-background p-6 sm:p-8">
                        <ReservationSteps />
                    </div>
                </div>
            </Container>
        </section>
    );
}
