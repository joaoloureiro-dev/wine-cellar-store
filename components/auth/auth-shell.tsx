import type { ReactNode } from "react";
import { CalendarCheck, Heart, MapPin, PackageCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";

type AuthShellProps = {
    title: string;
    description: string;
    children: ReactNode;
    footer: ReactNode;
};

const benefits = [
    { icon: PackageCheck, label: "Acompanhe as suas encomendas e pagamentos" },
    { icon: CalendarCheck, label: "Consulte as suas reservas" },
    { icon: Heart, label: "Guarde favoritos em todos os dispositivos" },
    { icon: MapPin, label: "Moradas guardadas para encomendar mais depressa" },
];

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
    return (
        <main>
            <Container className="py-10 sm:py-16 lg:py-20">
                <div className="mx-auto grid max-w-md gap-10 lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-stretch lg:gap-12">
                    <div>
                        <Eyebrow>Conta Cellarium</Eyebrow>
                        <h1 className="mt-4 text-balance font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] text-charcoal sm:text-5xl">
                            {title}
                        </h1>
                        <p className="mt-4 text-base leading-7 text-muted">{description}</p>

                        <div className="mt-8 rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-card sm:p-8">{children}</div>

                        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
                    </div>

                    <aside
                        aria-label="Vantagens da conta"
                        className="hidden flex-col justify-between overflow-hidden rounded-[2rem] p-10 shadow-lift surface-cellar lg:flex"
                    >
                        <div>
                            <Eyebrow tone="dark">A sua cave, organizada</Eyebrow>
                            <p className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-cellar-ink">
                                Tudo o que precisa num só lugar.
                            </p>
                        </div>

                        <ul role="list" className="mt-10 space-y-4">
                            {benefits.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-4 text-sm text-cellar-muted">
                                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-champagne/30 text-champagne">
                                        <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
                                    </span>
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </Container>
        </main>
    );
}
