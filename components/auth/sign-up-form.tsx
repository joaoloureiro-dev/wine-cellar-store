"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { emailSchema, nameSchema } from "@/lib/validation/fields";

type SignUpFormProps = {
    next: string;
    minPasswordLength: number;
};

type Field = "name" | "email" | "password" | "confirmPassword";

export function SignUpForm({ next, minPasswordLength }: SignUpFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const schema = z
        .object({
            name: nameSchema,
            email: emailSchema,
            password: z
                .string()
                .min(minPasswordLength, `A password deve ter pelo menos ${minPasswordLength} caracteres.`)
                .max(128, "A password é demasiado longa."),
            confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            path: ["confirmPassword"],
            message: "As passwords não coincidem.",
        });

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

        if (!parsed.success) {
            const fieldErrors = z.flattenError(parsed.error).fieldErrors as Partial<Record<Field, string[]>>;
            setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])));
            return;
        }

        setErrors({});
        setIsPending(true);

        const { name, email, password } = parsed.data;
        // The confirmation email links back to the profile.
        const { error } = await authClient.signUp.email({ name, email, password, callbackURL: "/conta/perfil" });

        if (error) {
            setIsPending(false);
            setFormError(getAuthErrorMessage(error));
            return;
        }

        toast.success("Conta criada", { description: "Bem-vindo à Cellarium." });
        router.replace(next);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
                <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {formError}
                </p>
            )}
            <Field label="Nome" name="name" error={errors.name}>
                <input id="name" name="name" type="text" autoComplete="name" required maxLength={100} {...errorProps("name", errors.name)} className={inputClassName} />
            </Field>
            <Field label="Email" name="email" error={errors.email}>
                <input id="email" name="email" type="email" autoComplete="email" required {...errorProps("email", errors.email)} className={inputClassName} />
            </Field>
            <Field label="Password" name="password" hint={`Mínimo de ${minPasswordLength} caracteres.`} error={errors.password}>
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={minPasswordLength} maxLength={128} {...errorProps("password", errors.password)} className={inputClassName} />
            </Field>
            <Field label="Confirmar password" name="confirmPassword" error={errors.confirmPassword}>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required {...errorProps("confirmPassword", errors.confirmPassword)} className={inputClassName} />
            </Field>
            <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={18} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Criar conta
            </button>
        </form>
    );
}
