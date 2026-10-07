import Link from "next/link";
import { ArrowRight, CalendarCheck, ShieldCheck, Truck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonArrowStyles, buttonStyles } from "@/components/ui/button-styles";
import { getBrands } from "@/lib/brands";
import { capacitySegments, catalogParams } from "@/lib/catalog/options";
import { paymentMethods } from "@/lib/checkout/payment-methods";
import { complaintsBookUrl, legalLinks } from "@/lib/legal/links";
import { getBrandHref } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

const shopLinks = [
    { label: "Caves de Vinho", href: "/caves" },
    { label: "Marcas", href: "/marcas" },
    { label: "Como escolher", href: "/#como-escolher" },
    { label: "Reservas", href: "/reservas" },
    { label: "Favoritos", href: "/favoritos" },
    { label: "Carrinho", href: "/carrinho" },
];

const accountLinks = [
    { label: "Entrar", href: "/entrar" },
    { label: "Criar conta", href: "/registar" },
    { label: "As minhas encomendas", href: "/conta/encomendas" },
    { label: "As minhas reservas", href: "/conta/reservas" },
];

const capacityLinks = capacitySegments.map((segment) => ({
    label: segment.label,
    href: `/caves?${new URLSearchParams({ [catalogParams.capacity]: segment.value })}`,
}));

const assurances = [
    { icon: Truck, label: "Entrega especializada", detail: "Em Portugal Continental" },
    { icon: ShieldCheck, label: "Garantia legal de 3 anos", detail: "Em equipamentos novos" },
    { icon: CalendarCheck, label: "Reserva sem pagamento", detail: "Confirmamos consigo" },
];

const linkClass =
    "rounded-sm text-sm text-cellar-muted transition-colors hover:text-cellar-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-soft";

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: { label: string; href: string }[];
}) {
    return (
        <div>
            <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-champagne-soft">
                {title}
            </h3>
            <ul role="list" className="mt-4 grid gap-3">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className={linkClass}>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export async function Footer() {
    const brands = await getBrands();

    return (
        <footer className="surface-cellar mt-auto" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Rodapé
            </h2>

            <Container>
                <div className="grid gap-8 border-b border-cellar-ink/10 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16 lg:py-16">
                    <div>
                        <p className="font-display text-[2.25rem] font-medium leading-[1.02] tracking-[-0.03em] text-cellar-ink sm:text-5xl">
                            Reserve hoje. Pague depois de confirmarmos.
                        </p>
                        <p className="mt-4 max-w-lg text-base leading-7 text-cellar-muted">
                            Garanta a cave que procura sem pagamento imediato. Confirmamos a
                            disponibilidade, o prazo e as condições consigo.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                        <Link href="/reservas" className={buttonStyles({ variant: "light" })}>
                            Como funcionam as reservas
                            <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className={buttonArrowStyles} />
                        </Link>
                        <Link href="/caves" className={buttonStyles({ variant: "ghost-dark" })}>
                            Ver caves
                        </Link>
                    </div>
                </div>

                <ul
                    role="list"
                    className="grid gap-4 border-b border-cellar-ink/10 py-8 sm:grid-cols-3"
                >
                    {assurances.map(({ icon: Icon, label, detail }) => (
                        <li key={label} className="flex items-center gap-4">
                            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-champagne/30 text-champagne">
                                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-cellar-ink">{label}</span>
                                <span className="block text-xs text-cellar-muted">{detail}</span>
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:py-16">
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link
                            href="/"
                            className="inline-flex items-baseline rounded-sm font-display text-4xl font-semibold tracking-[-0.03em] text-cellar-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne-soft"
                        >
                            {siteConfig.name}
                            <span aria-hidden="true" className="ml-0.5 size-2 -translate-y-1 rounded-full bg-champagne" />
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-6 text-cellar-muted">
                            {siteConfig.description}
                        </p>

                        <div className="mt-6">
                            <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-champagne-soft">
                                Contactos
                            </h3>
                            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-cellar-muted">
                                Email, telefone e horário de apoio
                                <span className="rounded-full border border-dashed border-champagne-soft/50 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-champagne-soft">
                                    Por definir
                                </span>
                            </p>
                        </div>
                    </div>

                    <FooterColumn title="Loja" links={shopLinks} />
                    <FooterColumn title="Por capacidade" links={capacityLinks} />
                    <FooterColumn
                        title="Marcas"
                        links={brands.map((brand) => ({ label: brand.name, href: getBrandHref(brand.slug) }))}
                    />
                    <FooterColumn title="Conta" links={accountLinks} />
                </div>

                <div className="flex flex-col gap-6 border-t border-cellar-ink/10 py-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="sr-only">Métodos de pagamento</h3>
                        <ul role="list" className="flex flex-wrap gap-2" aria-label="Métodos de pagamento">
                            {paymentMethods.map((method) => (
                                <li
                                    key={method.id}
                                    className="rounded-full border border-cellar-ink/15 bg-cellar-ink/5 px-3.5 py-1.5 text-xs font-semibold text-cellar-ink"
                                >
                                    {method.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav aria-label="Informação legal">
                        <ul role="list" className="flex flex-wrap gap-x-5 gap-y-2">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={`${linkClass} text-xs`}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <a
                                    href={complaintsBookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${linkClass} text-xs`}
                                >
                                    Livro de Reclamações
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div className="flex flex-col gap-2 border-t border-cellar-ink/10 py-6 text-xs text-cellar-muted sm:flex-row sm:justify-between">
                    <p>© {siteConfig.name}</p>
                    <p>Preços com IVA incluído</p>
                </div>
            </Container>
        </footer>
    );
}
