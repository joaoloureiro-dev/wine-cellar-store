import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { ChangePasswordForm, DeleteAccountForm, ProfileForm } from "@/components/account/profile-forms";
import { EmailVerificationStatus } from "@/components/auth/password-reset-forms";
import { getDeletionBlocker } from "@/lib/account/deletion";
import { hasPasswordAccount } from "@/lib/account/queries";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/server";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Perfil", robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
    const user = await requireUser("/conta/perfil");
    const [canChangePassword, deletionBlocker] = await Promise.all([hasPasswordAccount(user.id), getDeletionBlocker(user.id)]);

    return (
        <>
            <AccountHeading title="Perfil" />
            <div className="grid gap-8 xl:grid-cols-2">
                <section aria-labelledby="profile-heading" className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 sm:p-6">
                    <h2 id="profile-heading" className="mb-4 font-display text-2xl font-semibold text-charcoal">Dados pessoais</h2>
                    <ProfileForm name={user.name} email={user.email} />
                    <div className="mt-4">
                        <EmailVerificationStatus email={user.email} verified={user.emailVerified} />
                    </div>
                </section>
                <section aria-labelledby="password-heading" className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 sm:p-6">
                    <h2 id="password-heading" className="mb-4 font-display text-2xl font-semibold text-charcoal">Password</h2>
                    {canChangePassword ? (
                        <ChangePasswordForm minPasswordLength={PASSWORD_MIN_LENGTH} />
                    ) : (
                        <p className="text-sm text-muted">A sua conta usa o login com Google.</p>
                    )}
                </section>
                <section aria-labelledby="data-heading" className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 sm:p-6">
                    <h2 id="data-heading" className="mb-2 font-display text-2xl font-semibold text-charcoal">Os seus dados</h2>
                    <p className="mb-4 text-sm text-muted">
                        Descarregue uma cópia dos dados da sua conta: perfil, moradas, favoritos, encomendas e reservas.
                    </p>
                    <a
                        href="/api/account/export"
                        download
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        Descarregar os meus dados (JSON)
                    </a>
                </section>
                <section aria-labelledby="delete-heading" className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 sm:p-6">
                    <h2 id="delete-heading" className="mb-2 font-display text-2xl font-semibold text-charcoal">Eliminar conta</h2>
                    <p className="mb-4 text-sm text-muted">
                        A conta, as moradas e os favoritos são apagados. As encomendas são guardadas sem ligação à conta, pelo prazo que a lei fiscal
                        exige para as faturas; nas reservas concluídas, os contactos são apagados.
                    </p>
                    <DeleteAccountForm hasPassword={canChangePassword} blocker={deletionBlocker} />
                </section>
            </div>
        </>
    );
}
