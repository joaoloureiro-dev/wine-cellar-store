import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/password-reset-forms";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/server";

/** Reads the one-time token from the link: rendered per request. */
export const instant = false;

export const metadata: Metadata = {
    title: "Nova password",
    robots: { index: false, follow: false },
    // The URL carries a one-time token: never send it to other sites.
    referrer: "no-referrer",
};

export default async function NewPasswordPage(props: PageProps<"/nova-password">) {
    const params = await props.searchParams;
    const token = typeof params.token === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(params.token) ? params.token : null;

    return (
        <AuthShell
            title="Nova password"
            description="Escolha uma nova password para a sua conta."
            footer={
                <Link href="/entrar" className="font-semibold text-wine underline underline-offset-4">
                    Voltar a entrar
                </Link>
            }
        >
            {token ? (
                <NewPasswordForm token={token} minPasswordLength={PASSWORD_MIN_LENGTH} />
            ) : (
                <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    Este link já não é válido ou expirou.{" "}
                    <Link href="/recuperar-password" className="underline underline-offset-4">
                        Peça um novo link
                    </Link>
                    .
                </p>
            )}
        </AuthShell>
    );
}
