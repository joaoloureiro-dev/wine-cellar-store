import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/layout/container";
import { getAdmin } from "@/lib/admin/auth";

/**
 * Navigation only. Every account page checks the session itself
 * (requireUser), so access control never depends on the layout.
 */
/**
 * Session-bound pages: no instant static shell to validate. Guests are
 * redirected (and non-admins get a 404) in proxy.ts, before streaming, so
 * the HTTP status is real; every page and action checks access again.
 */
export const instant = false;

export default async function AccountLayout({ children }: { children: ReactNode }) {
    const admin = await getAdmin();

    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
                    <aside className="lg:sticky lg:top-24 lg:self-start lg:rounded-3xl lg:border lg:border-charcoal/8 lg:bg-surface lg:p-3 lg:shadow-card">
                        <AccountNav showAdmin={Boolean(admin)} />
                    </aside>
                    <div className="min-w-0">{children}</div>
                </div>
            </Container>
        </main>
    );
}
