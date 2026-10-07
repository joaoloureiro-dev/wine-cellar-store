import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

type AuthShellProps = {
    title: string;
    description: string;
    children: ReactNode;
    footer: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
    return (
        <main>
            <Container className="py-12 sm:py-16 lg:py-24">
                <div className="mx-auto max-w-md">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-champagne" />
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine">
                            Conta Cellarium
                        </span>
                    </div>
                    <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-3 text-base leading-7 text-muted">{description}</p>

                    <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">{children}</div>

                    <div className="mt-6 text-center text-sm text-muted">{footer}</div>
                </div>
            </Container>
        </main>
    );
}
