import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { hasPasswordAccount } from "@/lib/account/queries";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/server";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Perfil", robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
    const user = await requireUser("/conta/perfil");
    const canChangePassword = await hasPasswordAccount(user.id);

    return (
        <>
            <AccountHeading title="Perfil" />
            <div className="grid gap-8 xl:grid-cols-2">
                <section aria-labelledby="profile-heading" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                    <h2 id="profile-heading" className="mb-4 font-display text-2xl font-semibold text-charcoal">Dados pessoais</h2>
                    <ProfileForm name={user.name} email={user.email} />
                </section>
                <section aria-labelledby="password-heading" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                    <h2 id="password-heading" className="mb-4 font-display text-2xl font-semibold text-charcoal">Password</h2>
                    {canChangePassword ? (
                        <ChangePasswordForm minPasswordLength={PASSWORD_MIN_LENGTH} />
                    ) : (
                        <p className="text-sm text-muted">A sua conta usa o login com Google.</p>
                    )}
                </section>
            </div>
        </>
    );
}
