import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { RequestPasswordResetForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = {
    title: "Recuperar password",
    robots: { index: false, follow: false },
};

export default function RequestPasswordResetPage() {
    return (
        <AuthShell
            title="Recuperar password"
            description="Indique o email da sua conta e enviamos um link para escolher uma nova password."
            footer={
                <>
                    Lembrou-se?{" "}
                    <Link href="/entrar" className="font-semibold text-wine underline underline-offset-4">
                        Entrar
                    </Link>
                </>
            }
        >
            <RequestPasswordResetForm />
        </AuthShell>
    );
}
