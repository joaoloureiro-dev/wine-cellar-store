import Link from "next/link";
import { ArrowRight, Compass, Search, Tags } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonArrowStyles, buttonStyles } from "@/components/ui/button-styles";
import { Eyebrow } from "@/components/ui/eyebrow";

const shortcuts = [
    { href: "/caves", label: "Caves de Vinho", description: "Todo o catálogo, com filtros", icon: Compass },
    { href: "/marcas", label: "Marcas", description: "Os fabricantes com que trabalhamos", icon: Tags },
    { href: "/pesquisa", label: "Pesquisar", description: "Procure por modelo ou capacidade", icon: Search },
];

export default function NotFound() {
    return (
        <main>
            <Container className="py-10 sm:py-16 lg:py-20">
                <section
                    aria-labelledby="not-found-heading"
                    className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center shadow-lift surface-cellar sm:px-12 sm:py-20"
                >
                    <p
                        aria-hidden="true"
                        className="pointer-events-none font-display text-[7rem] font-medium leading-none tracking-[-0.06em] text-cellar-ink/10 sm:text-[11rem]"
                    >
                        404
                    </p>

                    <div className="relative -mt-10 sm:-mt-16">
                        <Eyebrow tone="dark">Página não encontrada</Eyebrow>
                        <h1
                            id="not-found-heading"
                            className="mx-auto mt-5 max-w-2xl text-balance font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.035em] text-cellar-ink sm:text-6xl"
                        >
                            Esta página não está na nossa cave.
                        </h1>
                        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-cellar-muted">
                            O endereço pode ter mudado ou deixado de existir. Continue a partir de um destes caminhos.
                        </p>

                        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link href="/caves" className={buttonStyles()}>
                                Explorar caves
                                <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className={buttonArrowStyles} />
                            </Link>
                            <Link href="/" className={buttonStyles({ variant: "ghost-dark" })}>
                                Voltar ao início
                            </Link>
                        </div>
                    </div>
                </section>

                <ul role="list" className="mt-6 grid gap-4 sm:grid-cols-3">
                    {shortcuts.map(({ href, label, description, icon: Icon }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className="group flex h-full items-center gap-4 rounded-3xl border border-charcoal/8 bg-surface p-5 shadow-card transition-[transform,border-color] duration-300 ease-cellar hover:-translate-y-0.5 hover:border-champagne/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                            >
                                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-wine-light text-wine">
                                    <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-semibold text-charcoal">{label}</span>
                                    <span className="block text-sm text-muted">{description}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </Container>
        </main>
    );
}
