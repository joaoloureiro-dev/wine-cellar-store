import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isGoogleSignInEnabled } from "@/lib/auth/server";
import { getSession, safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Entrar",
    robots: { index: false, follow: false },
};

export default async function SignInPage(props: PageProps<"/entrar">) {
    const next = safeNextPath((await props.searchParams).next);

    if (await getSession()) {
        redirect(next);
    }

    return (
        <AuthShell
            title="Entrar"
            description="Aceda às suas encomendas, reservas, moradas e favoritos."
            footer={
                <>
                    Ainda não tem conta?{" "}
                    <Link href={`/registar?next=${encodeURIComponent(next)}`} className="font-semibold text-wine underline underline-offset-4">
                        Criar conta
                    </Link>
                </>
            }
        >
            {isGoogleSignInEnabled() && <GoogleButton next={next} />}
            <SignInForm next={next} />
        </AuthShell>
    );
}
