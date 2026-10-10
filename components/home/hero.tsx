import Link from "next/link";
import { ArrowRight, CalendarCheck, ShieldCheck, Truck } from "lucide-react";

import { HeroCategories } from "@/components/home/hero-categories";
import { Container } from "@/components/layout/container";
import { buttonArrowStyles, buttonStyles } from "@/components/ui/button-styles";
import { Eyebrow } from "@/components/ui/eyebrow";

const facts = [
    { icon: Truck, label: "Entrega especializada" },
    { icon: ShieldCheck, label: "Compra segura" },
    { icon: CalendarCheck, label: "Reserva sem pagamento imediato" },
];

/** Shelves of the illustrated cellar; the gold line marks the zone split. */
const shelves = ["bottles", "bottles", "bottles", "zone", "bottles", "bottles", "bottles"] as const;

export function Hero() {
    return (
        <section aria-labelledby="hero-heading" className="surface-cellar overflow-hidden">
            <Container>
                <div className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
                    <div className="max-w-2xl">
                        <Eyebrow tone="dark" className="animate-rise motion-reduce:animate-none">
                            Conservação de vinho
                        </Eyebrow>

                        <h1
                            id="hero-heading"
                            className="mt-6 animate-rise text-balance font-display text-[3rem] font-medium leading-[0.95] tracking-[-0.04em] text-cellar-ink [animation-delay:80ms] motion-reduce:animate-none sm:text-6xl md:text-7xl lg:text-[5.6rem]"
                        >
                            O ambiente certo para cada garrafa.
                        </h1>

                        <p className="mt-7 max-w-xl animate-rise text-base leading-7 text-cellar-muted [animation-delay:160ms] motion-reduce:animate-none sm:text-lg sm:leading-8">
                            Descubra caves de vinho selecionadas para preservar temperatura,
                            estabilidade e condições ideais para a sua coleção.
                        </p>

                        <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:240ms] motion-reduce:animate-none sm:flex-row">
                            <Link href="/caves" className={buttonStyles()}>
                                Explorar caves
                                <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className={buttonArrowStyles} />
                            </Link>

                            <Link href="/guia" className={buttonStyles({ variant: "ghost-dark" })}>
                                Encontrar a cave ideal
                            </Link>
                        </div>

                        <ul
                            role="list"
                            className="mt-10 flex animate-rise flex-col gap-4 border-t border-cellar-ink/10 pt-7 [animation-delay:320ms] motion-reduce:animate-none sm:flex-row sm:flex-wrap sm:gap-x-8"
                        >
                            {facts.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-3 text-sm text-cellar-muted">
                                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-champagne" />
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <HeroIllustration />
                </div>

                <HeroCategories />
            </Container>
        </section>
    );
}

function HeroIllustration() {
    return (
        <div
            aria-hidden="true"
            className="relative mx-auto hidden aspect-4/5 w-full max-w-[22rem] animate-rise md:block [animation-delay:200ms] motion-reduce:animate-none sm:max-w-md"
        >
            <div className="absolute inset-[8%_6%] rounded-full bg-[radial-gradient(closest-side,rgb(212_160_84/0.22),transparent)] blur-md" />
            <div className="absolute inset-0 scale-[1.08] rounded-full border border-champagne/20" />

            <div className="absolute left-1/2 top-1/2 flex h-[86%] w-[54%] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-t-[1.6rem] rounded-b-xl border border-cellar-ink/10 bg-linear-to-br from-[#2a2320] to-[#110d0c] shadow-[inset_0_0_0_6px_#0c0908,0_40px_80px_-30px_rgb(0_0_0/0.8),0_0_120px_-20px_rgb(212_160_84/0.25)]">
                <div className="relative m-3.5 flex flex-1 flex-col justify-evenly rounded-xl border border-cellar-ink/5 bg-linear-to-b from-[rgb(212_160_84/0.14)] via-[rgb(212_160_84/0.03)] to-black/10 px-4 py-2.5">
                    {shelves.map((shelf, index) =>
                        shelf === "zone" ? (
                            <div key={index} className="h-px bg-champagne/50" />
                        ) : (
                            <div key={index} className="relative h-px bg-cellar-ink/12">
                                <div className="absolute inset-x-[10%] bottom-[3px] h-3.5 rounded-full bg-[repeating-linear-gradient(90deg,#5a1724_0_13%,#3b0f18_13%_15%)] shadow-[0_0_0_1px_rgb(184_155_101/0.35)]" />
                            </div>
                        ),
                    )}
                    <div className="absolute inset-0 rounded-xl bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.06)_45%,transparent_55%)]" />
                </div>

                <div className="flex items-end justify-between border-t border-cellar-ink/10 px-4 pb-4 pt-3">
                    <div>
                        <span className="block text-[0.5625rem] uppercase tracking-[0.2em] text-cellar-muted">
                            Temperatura
                        </span>
                        <span className="text-xl font-medium tabular-nums text-cellar-ink">12 °C</span>
                    </div>
                    <span className="mb-1.5 size-1.5 rounded-full bg-champagne-soft shadow-[0_0_10px_var(--champagne)]" />
                </div>
            </div>

            <div className="absolute left-0 top-[14%] rounded-2xl border border-champagne-soft/20 bg-cellar-raised/70 px-5 py-3.5 shadow-[0_20px_40px_-20px_#000] backdrop-blur-md sm:-left-6">
                <span className="block text-[0.625rem] font-bold uppercase tracking-[0.2em] text-champagne-soft">
                    Controlo preciso
                </span>
                <span className="font-display text-xl text-cellar-ink">Temperatura estável</span>
            </div>

        </div>
    );
}
