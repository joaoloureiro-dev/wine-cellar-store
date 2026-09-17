import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";

import { Container } from "@/components/layout/container";

export function Hero() {
    return (
        <section className="overflow-hidden border-b border-border bg-background">
            <Container>
                <div className="grid min-h-[calc(100vh-112px)] items-center gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
                    <div className="max-w-3xl">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="h-px w-8 bg-champagne" />

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine sm:text-sm">
                                Conservação de vinho
                            </span>
                        </div>

                        <h1 className="font-display text-5xl font-medium leading-[0.92] tracking-[-0.045em] text-charcoal sm:text-6xl md:text-7xl lg:text-[5.4rem]">
                            O ambiente certo para cada garrafa.
                        </h1>

                        <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                            Descubra caves de vinho selecionadas para preservar temperatura,
                            estabilidade e condições ideais para a sua coleção.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/caves"
                                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-wine px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-wine-dark"
                            >
                                Explorar caves
                                <ArrowRight size={18} strokeWidth={1.8} />
                            </Link>

                            <Link
                                href="/guia"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-surface px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted"
                            >
                                Encontrar a cave ideal
                            </Link>
                        </div>

                        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-7 sm:flex-row sm:items-center sm:gap-8">
                            <div className="flex items-center gap-3">
                                <Truck
                                    size={20}
                                    strokeWidth={1.6}
                                    className="shrink-0 text-wine"
                                />

                                <span className="text-sm text-muted">
                                    Entrega especializada
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <ShieldCheck
                                    size={20}
                                    strokeWidth={1.6}
                                    className="shrink-0 text-wine"
                                />

                                <span className="text-sm text-muted">
                                    Compra segura
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-110 sm:min-h-130 lg:min-h-162.5">
                        <div className="absolute inset-x-10 bottom-4 top-14 rounded-4xl bg-surface-muted sm:inset-x-16 lg:inset-x-10" />

                        <div className="absolute -right-24 top-4 size-72 rounded-full border border-champagne/30 sm:size-96" />

                        <div className="absolute -left-8 bottom-10 size-36 rounded-full bg-wine-light/60 blur-3xl" />

                        <div className="relative flex h-full min-h-110 items-center justify-center sm:min-h-130 lg:min-h-162.5">
                            <div className="relative flex h-97.5 w-47.5 flex-col overflow-hidden rounded-t-[1.75rem] rounded-b-xl border border-white/10 bg-charcoal shadow-[0_30px_80px_-30px_rgba(24,22,20,0.45)] sm:h-117.5 sm:w-57.5 lg:h-135 lg:w-65">
                                <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
                                    <span className="font-display text-lg text-white/90">
                                        Cellarium
                                    </span>

                                    <span className="size-2 rounded-full bg-champagne" />
                                </div>

                                <div className="flex flex-1 flex-col justify-evenly px-5 py-6">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="relative h-px bg-white/15"
                                        >
                                            <div className="absolute bottom-1 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-full border border-champagne/50 bg-linear-to-r from-wine-dark via-wine to-wine-dark opacity-90" />
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-white/10 px-5 py-5">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">
                                                Temperature
                                            </span>

                                            <span className="mt-1 block text-xl font-medium text-white">
                                                12°C
                                            </span>
                                        </div>

                                        <span className="text-xs text-white/40">48 bottles</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-0 rounded-lg border border-border bg-surface px-5 py-4 shadow-lg sm:left-6 lg:-left-3">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                                Controlo preciso
                            </span>

                            <span className="mt-1 block font-display text-xl font-semibold text-charcoal">
                                Temperatura estável
                            </span>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}