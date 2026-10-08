import Link from "next/link";
import { House, Layers, Wine, type LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
    capacitySegments,
    catalogParams,
    getInstallationLabel,
    installationOptions,
    zoneOptions,
} from "@/lib/catalog/options";
import { getZonesLabel } from "@/lib/product-display";

function filterHref(param: string, value: string | number) {
    return `/caves?${new URLSearchParams({ [param]: String(value) })}`;
}

type Criterion = {
    icon: LucideIcon;
    title: string;
    description: string;
    links: { label: string; href: string }[];
};

const criteria: Criterion[] = [
    {
        icon: Wine,
        title: "Capacidade",
        description:
            "Conte as garrafas que tem hoje e deixe margem para a coleção crescer nos próximos anos.",
        links: capacitySegments.map((segment) => ({
            label: segment.label,
            href: filterHref(catalogParams.capacity, segment.value),
        })),
    },
    {
        icon: Layers,
        title: "Zonas de temperatura",
        description:
            "Uma zona para guarda prolongada. Duas ou três para ter brancos, tintos e espumantes prontos a servir.",
        links: zoneOptions.map((zones) => ({
            label: getZonesLabel(zones),
            href: filterHref(catalogParams.zones, zones),
        })),
    },
    {
        icon: House,
        title: "Instalação",
        description:
            "Livre instalação para qualquer divisão; encastre ou sob bancada para integrar na cozinha.",
        links: installationOptions.map((option) => ({
            label: getInstallationLabel(option.value),
            href: filterHref(catalogParams.installation, option.value),
        })),
    },
];

export function CellarGuide() {
    return (
        <section
            id="como-escolher"
            aria-labelledby="cellar-guide-heading"
            className="surface-cellar scroll-mt-20 py-16 sm:py-20 lg:py-28"
        >
            <Container>
                <SectionHeading
                    id="cellar-guide-heading"
                    tone="dark"
                    eyebrow="Como escolher a sua cave"
                    title="Três perguntas antes de escolher."
                    description="A capacidade, as zonas de temperatura e o tipo de instalação definem a cave certa. Escolha uma opção para ver os modelos que correspondem."
                    className="reveal"
                />

                <ol role="list" className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3 lg:gap-6">
                    {criteria.map(({ icon: Icon, title, description, links }, index) => (
                        <li
                            key={title}
                            className="reveal flex flex-col rounded-3xl border border-cellar-ink/10 bg-cellar-raised/70 p-6 backdrop-blur-sm sm:p-8"
                        >
                            <div className="flex items-center justify-between">
                                <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-champagne/30 text-champagne">
                                    <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                                </span>
                                <span aria-hidden="true" className="font-display text-3xl text-champagne/60">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>

                            <h3 className="mt-6 font-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-cellar-ink">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-cellar-muted">{description}</p>

                            <ul role="list" className="mt-6 flex flex-wrap gap-2" aria-label={`Ver caves por ${title.toLowerCase()}`}>
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="inline-flex min-h-10 items-center rounded-full border border-cellar-ink/15 px-4 text-sm font-medium text-cellar-ink transition-colors duration-200 hover:border-champagne-soft hover:bg-champagne-soft hover:text-cellar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-soft"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ol>
            </Container>
        </section>
    );
}
