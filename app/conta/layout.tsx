import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/layout/container";
import { getAdmin } from "@/lib/admin/auth";

/**
 * Navigation only. Every account page checks the session itself
 * (requireUser), so access control never depends on the layout.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
    const admin = await getAdmin();

    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <AccountNav showAdmin={Boolean(admin)} />
                    </aside>
                    <div className="min-w-0">{children}</div>
                </div>
            </Container>
        </main>
    );
}
