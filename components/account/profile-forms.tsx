"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction, type ProfileFormState } from "@/lib/account/actions";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";

const buttonClass =
    "inline-flex min-h-11 items-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60";

const initialProfile: ProfileFormState = { status: "idle", submissionId: 0 };

export function ProfileForm({ name, email }: { name: string; email: string }) {
    const [state, formAction, isPending] = useActionState(updateProfileAction, initialProfile);
    const toast = useToast();

    useEffect(() => {
        if (state.submissionId === 0) {
            return;
        }

        if (state.status === "success") {
            toast.success(state.message ?? "Perfil atualizado");
        } else if (state.message) {
            toast.error(state.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submissionId]);

    return (
        <form action={formAction} noValidate className="space-y-4">
            <Field label="Nome" name="name" error={state.fieldError}>
                <input id="name" name="name" autoComplete="name" maxLength={100} defaultValue={name} {...errorProps("name", state.fieldError)} className={inputClassName} />
            </Field>
            <Field label="Email" name="email" hint="A alteração de email fica disponível em breve.">
                <input id="email" value={email} readOnly className={`${inputClassName} bg-surface-muted text-muted`} />
            </Field>
            <button type="submit" disabled={isPending} className={buttonClass}>
                {isPending && <LoaderCircle size={16} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Guardar
            </button>
        </form>
    );
}

export function ChangePasswordForm({ minPasswordLength }: { minPasswordLength: number }) {
    const toast = useToast();
    const [errors, setErrors] = useState<Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>>({});
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
        const nextErrors: typeof errors = {};

        if (!data.currentPassword) nextErrors.currentPassword = "Indique a password atual.";
        if ((data.newPassword ?? "").length < minPasswordLength) nextErrors.newPassword = `Mínimo de ${minPasswordLength} caracteres.`;
        if (data.newPassword !== data.confirmPassword) nextErrors.confirmPassword = "As passwords não coincidem.";

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setIsPending(true);
        const { error } = await authClient.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
            revokeOtherSessions: true,
        });
        setIsPending(false);

        if (error) {
            toast.error("Não foi possível alterar a password", { description: getAuthErrorMessage(error) });
            return;
        }

        form.reset();
        toast.success("Password alterada", { description: "As outras sessões foram terminadas." });
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Password atual" name="currentPassword" error={errors.currentPassword}>
                <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" {...errorProps("currentPassword", errors.currentPassword)} className={inputClassName} />
            </Field>
            <Field label="Nova password" name="newPassword" hint={`Mínimo de ${minPasswordLength} caracteres.`} error={errors.newPassword}>
                <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" maxLength={128} {...errorProps("newPassword", errors.newPassword)} className={inputClassName} />
            </Field>
            <Field label="Confirmar nova password" name="confirmPassword" error={errors.confirmPassword}>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" {...errorProps("confirmPassword", errors.confirmPassword)} className={inputClassName} />
            </Field>
            <button type="submit" disabled={isPending} className={buttonClass}>
                {isPending && <LoaderCircle size={16} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Alterar password
            </button>
        </form>
    );
}
