"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { errorProps, Field, FieldError, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction, type ProfileFormState } from "@/lib/account/actions";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";

const buttonClass =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60";

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

/**
 * Deletes the account through Better Auth (/delete-user: rate limited,
 * origin-checked). The server re-checks every rule; `blocker` only
 * explains up front why it is not possible yet.
 */
export function DeleteAccountForm({ hasPassword, blocker }: { hasPassword: boolean; blocker: string | null }) {
    const toast = useToast();
    const router = useRouter();
    const [errors, setErrors] = useState<Partial<Record<"deletePassword" | "confirmDeletion", string>>>({});
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const password = String(data.get("deletePassword") ?? "");
        const nextErrors: typeof errors = {};

        if (hasPassword && !password) nextErrors.deletePassword = "Indique a sua password.";
        if (data.get("confirmDeletion") !== "on") nextErrors.confirmDeletion = "Confirme que quer eliminar a conta.";

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setIsPending(true);
        const { error } = await authClient.deleteUser(hasPassword ? { password } : {});
        setIsPending(false);

        if (error) {
            toast.error("Não foi possível eliminar a conta", { description: getAuthErrorMessage(error) });
            return;
        }

        toast.success("Conta eliminada", { description: "Os seus dados pessoais foram removidos." });
        router.replace("/");
        router.refresh();
    }

    if (blocker) {
        return <p className="rounded-2xl border border-border bg-surface-muted p-4 text-sm text-charcoal">{getAuthErrorMessage({ code: blocker })}</p>;
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {hasPassword && (
                <Field label="Password" name="deletePassword" error={errors.deletePassword}>
                    <input id="deletePassword" name="deletePassword" type="password" autoComplete="current-password" {...errorProps("deletePassword", errors.deletePassword)} className={inputClassName} />
                </Field>
            )}
            <div>
                <label className="flex items-start gap-3 text-sm text-charcoal">
                    <input type="checkbox" id="confirmDeletion" name="confirmDeletion" {...errorProps("confirmDeletion", errors.confirmDeletion)} className="mt-0.5 size-4 accent-wine" />
                    <span>Compreendo que a conta, as moradas e os favoritos são eliminados definitivamente.</span>
                </label>
                <FieldError name="confirmDeletion" error={errors.confirmDeletion} />
            </div>
            <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-danger px-6 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={16} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Eliminar conta
            </button>
        </form>
    );
}
