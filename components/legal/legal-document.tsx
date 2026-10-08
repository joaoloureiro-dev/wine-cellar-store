import type { ReactNode } from "react";

import { PageIntro } from "@/components/catalog/page-intro";
import { Container } from "@/components/layout/container";
import { companyFieldLabels, getCompany, LEGAL_LAST_UPDATED, type CompanyField } from "@/lib/legal/company";

const lastUpdated = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "Europe/Lisbon" }).format(new Date(LEGAL_LAST_UPDATED));

/** Layout shared by the legal pages: intro, last update and readable text. */
export function LegalDocument({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <main>
            <PageIntro breadcrumbs={[{ label: "Início", href: "/" }, { label: title }]} eyebrow="Informação legal" title={title} description={description} />
            <Container className="py-10 sm:py-14">
                <article className="max-w-3xl space-y-10 text-base leading-7 text-charcoal [&_a]:font-semibold [&_a]:text-wine [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:tracking-[-0.02em] [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
                    <p className="text-sm text-muted">Última atualização: {lastUpdated}</p>
                    {children}
                </article>
            </Container>
        </main>
    );
}

/** A seller detail, or a visible marker while LEGAL_* is not configured. */
export function CompanyDetail({ field }: { field: CompanyField }) {
    const value = getCompany()[field];

    return value ? <>{value}</> : <mark className="rounded bg-warning/20 px-1 text-charcoal">[{companyFieldLabels[field]} a preencher]</mark>;
}

/** Business decision still to be made, shown visibly until it is. */
export function ToConfirm({ children }: { children: ReactNode }) {
    return <mark className="rounded bg-warning/20 px-1 text-charcoal">[{children}]</mark>;
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
            <h2 id={`${id}-title`}>{title}</h2>
            {children}
        </section>
    );
}
