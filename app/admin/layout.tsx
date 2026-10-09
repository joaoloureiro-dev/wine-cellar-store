import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/layout/container";

/**
 * Session-bound pages: no instant static shell to validate. Guests are
 * redirected (and non-admins get a 404) in proxy.ts, before streaming, so
 * the HTTP status is real; every page and action checks access again.
 */
export const instant = false;

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

/**
 * Navigation only. Every backoffice page and server action checks the
 * admin role itself (requireAdmin / getAdmin), never relying on the layout.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <main className="bg-surface-muted/40">
            <Container className="py-6 sm:py-10 lg:py-12">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
                    <aside className="lg:sticky lg:top-24 lg:self-start lg:rounded-3xl lg:p-4 lg:shadow-lift lg:surface-cellar">
                        <div className="mb-4 hidden px-3 pt-2 lg:block">
                            <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-cellar-ink">
                                Backoffice
                            </p>
                            <p className="mt-1 text-xs text-cellar-muted">Gestão da loja</p>
                            <span aria-hidden="true" className="gold-rule mt-4 block" />
                        </div>
                        <AdminNav />
                    </aside>
                    <div className="min-w-0">{children}</div>
                </div>
            </Container>
        </main>
    );
}
