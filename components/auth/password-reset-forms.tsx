"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";

const buttonClass =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Indique um email válido."));

/** Always shows the same confirmation, so it never reveals which emails have an account. */
export function RequestPasswordResetForm() {
    const [error, setError] = useState<string>();
    const [formError, setFormError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const parsed = emailSchema.safeParse(new FormData(event.currentTarget).get("email"));

        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message);
            return;
        }

        setError(undefined);
        setIsPending(true);
        const { error: requestError } = await authClient.requestPasswordReset({ email: parsed.data, redirectTo: "/nova-password" });
        setIsPending(false);

        if (requestError) {
            setFormError(getAuthErrorMessage(requestError));
            return;
        }

        setSentTo(parsed.data);
    }

    if (sentTo) {
        return (
            <div role="status" className="space-y-3 rounded-2xl border border-border bg-surface-muted p-5 text-sm text-charcoal">
                <p className="flex items-center gap-2 font-semibold">
                    <MailCheck size={18} aria-hidden="true" /> Verifique o seu email
                </p>
                <p>
                    Se existir uma conta com <strong>{sentTo}</strong>, enviámos um link para escolher uma nova password. O link é válido durante 1
                    hora. Não se esqueça de ver a pasta de spam.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
                <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {formError}
                </p>
            )}
            <Field label="Email" name="email" error={error}>
                <input id="email" name="email" type="email" autoComplete="email" required {...errorProps("email", error)} className={inputClassName} />
            </Field>
            <button type="submit" disabled={isPending} aria-busy={isPending} className={buttonClass}>
                {isPending && <LoaderCircle size={18} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Enviar link
            </button>
        </form>
    );
}

export function NewPasswordForm({ token, minPasswordLength }: { token: string; minPasswordLength: number }) {
    const router = useRouter();
    const toast = useToast();
    const [errors, setErrors] = useState<Partial<Record<"newPassword" | "confirmPassword", string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
        const nextErrors: typeof errors = {};

        if ((data.newPassword ?? "").length < minPasswordLength) nextErrors.newPassword = `Mínimo de ${minPasswordLength} caracteres.`;
        if (data.newPassword !== data.confirmPassword) nextErrors.confirmPassword = "As passwords não coincidem.";

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setIsPending(true);
        const { error } = await authClient.resetPassword({ newPassword: data.newPassword, token });
        setIsPending(false);

        if (error) {
            setFormError(getAuthErrorMessage(error));
            return;
        }

        toast.success("Password alterada", { description: "Entre com a nova password." });
        router.replace("/entrar");
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
                <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {formError}{" "}
                    <Link href="/recuperar-password" className="underline underline-offset-4">
                        Pedir novo link
                    </Link>
                </p>
            )}
            <Field label="Nova password" name="newPassword" hint={`Mínimo de ${minPasswordLength} caracteres.`} error={errors.newPassword}>
                <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" maxLength={128} {...errorProps("newPassword", errors.newPassword)} className={inputClassName} />
            </Field>
            <Field label="Confirmar nova password" name="confirmPassword" error={errors.confirmPassword}>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" {...errorProps("confirmPassword", errors.confirmPassword)} className={inputClassName} />
            </Field>
            <button type="submit" disabled={isPending} aria-busy={isPending} className={buttonClass}>
                {isPending && <LoaderCircle size={18} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Guardar nova password
            </button>
        </form>
    );
}

/** Profile: shows whether the email is confirmed, and resends the link. */
export function EmailVerificationStatus({ email, verified }: { email: string; verified: boolean }) {
    const toast = useToast();
    const [isPending, setIsPending] = useState(false);

    if (verified) {
        return <p className="text-sm text-muted">Email confirmado.</p>;
    }

    async function resend() {
        setIsPending(true);
        const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/conta/perfil" });
        setIsPending(false);

        if (error) {
            toast.error("Não foi possível enviar", { description: getAuthErrorMessage(error) });
            return;
        }

        toast.success("Email enviado", { description: `Abra o link que enviámos para ${email}.` });
    }

    return (
        <p className="text-sm text-muted">
            Email por confirmar.{" "}
            <button type="button" onClick={resend} disabled={isPending} className="font-semibold text-wine underline underline-offset-4 disabled:opacity-60">
                Reenviar email de confirmação
            </button>
        </p>
    );
}
