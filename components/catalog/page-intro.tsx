import type { ReactNode } from "react";

import {
    Breadcrumbs,
    type BreadcrumbItem,
} from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";

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
        <section className="border-b border-border bg-background">
            <Container className="py-10 sm:py-14 lg:py-20">
                <Breadcrumbs items={breadcrumbs} />

                <div className="mt-8 flex flex-col gap-6 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="h-px w-8 bg-champagne" />

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine">
                                {eyebrow}
                            </span>
                        </div>

                        <h1 className="font-display text-4xl font-medium leading-none tracking-[-0.04em] text-charcoal sm:text-5xl lg:text-7xl">
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
