import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

/**
 * Navigation only. Every backoffice page and server action checks the
 * admin role itself (requireAdmin / getAdmin), never relying on the layout.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.2em] text-wine lg:block">
                            Backoffice
                        </p>
                        <AdminNav />
                    </aside>
                    <div className="min-w-0">{children}</div>
                </div>
            </Container>
        </main>
    );
}
