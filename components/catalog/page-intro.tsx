import type { ReactNode } from "react";

import {
    Breadcrumbs,
    type BreadcrumbItem,
} from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";

type PageIntroProps = {
    breadcrumbs: BreadcrumbItem[];
    eyebrow: string;
    title: string;
    description: string;
    meta?: ReactNode;
};

export function PageIntro({
    breadcrumbs,
    eyebrow,
    title,
    description,
    meta,
}: PageIntroProps) {
    return (
        <section className="relative overflow-hidden border-b border-border bg-background">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-champagne/25 sm:size-[28rem]"
            />

            <Container className="relative py-8 sm:py-12 lg:py-16">
                <Breadcrumbs items={breadcrumbs} />

                <div className="mt-8 flex flex-col gap-6 sm:mt-10 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <Eyebrow>{eyebrow}</Eyebrow>

                        <h1 className="mt-4 text-balance font-display text-[2.75rem] font-medium leading-[0.98] tracking-[-0.04em] text-charcoal sm:text-6xl lg:text-7xl">
                            {title}
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                            {description}
                        </p>
                    </div>

                    {meta && (
                        <div className="shrink-0 text-sm font-medium text-muted">
                            {meta}
                        </div>
                    )}
                </div>
            </Container>
        </section>
    );
}
