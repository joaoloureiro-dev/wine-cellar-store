"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";

const schema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email("Indique um email válido.")),
    password: z.string().min(1, "Indique a password."),
});

type Errors = Partial<Record<"email" | "password", string>>;

export function SignInForm({ next }: { next: string }) {
    const router = useRouter();
    const toast = useToast();
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

        if (!parsed.success) {
            const fieldErrors = z.flattenError(parsed.error).fieldErrors;
            setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
            return;
        }

        setErrors({});
        setIsPending(true);

        const { error } = await authClient.signIn.email(parsed.data);

        if (error) {
            setIsPending(false);
            setFormError(getAuthErrorMessage(error));
            return;
        }

        toast.success("Sessão iniciada");
        router.replace(next);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
                <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {formError}
                </p>
            )}
            <Field label="Email" name="email" error={errors.email}>
                <input id="email" name="email" type="email" autoComplete="email" required {...errorProps("email", errors.email)} className={inputClassName} />
            </Field>
            <Field label="Password" name="password" error={errors.password}>
                <input id="password" name="password" type="password" autoComplete="current-password" required {...errorProps("password", errors.password)} className={inputClassName} />
            </Field>
            <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={18} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Entrar
            </button>
        </form>
    );
}
