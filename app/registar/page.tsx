import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleSignInEnabled, PASSWORD_MIN_LENGTH } from "@/lib/auth/server";
import { getSession, safeNextPath } from "@/lib/auth/session";

/** Per-request page (session, cookies or private data): rendered on demand. */
export const instant = false;

export const metadata: Metadata = {
    title: "Criar conta",
    robots: { index: false, follow: false },
};

export default async function SignUpPage(props: PageProps<"/registar">) {
    const next = safeNextPath((await props.searchParams).next);

    if (await getSession()) {
        redirect(next);
    }

    return (
        <AuthShell
            title="Criar conta"
            description="Acompanhe encomendas e reservas e guarde moradas e favoritos. Também pode comprar sem conta."
            footer={
                <>
                    Já tem conta?{" "}
                    <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="font-semibold text-wine underline underline-offset-4">
                        Entrar
                    </Link>
                </>
            }
        >
            {isGoogleSignInEnabled() && <GoogleButton next={next} />}
            <SignUpForm next={next} minPasswordLength={PASSWORD_MIN_LENGTH} />
        </AuthShell>
    );
}
