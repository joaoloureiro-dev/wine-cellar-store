import type { Metadata } from "next";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "A minha conta",
    robots: { index: false, follow: false },
};

export default async function AccountPage() {
    const user = await requireUser("/conta");

    return (
        <main>
            <Container className="py-10 sm:py-14 lg:py-20">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-champagne" />
                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-wine">A minha conta</span>
                        </div>
                        <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">
                            Olá, {user.name}
                        </h1>
                        <p className="mt-2 text-sm text-muted">{user.email}</p>
                    </div>
                    <SignOutButton />
                </div>
            </Container>
        </main>
    );
}
