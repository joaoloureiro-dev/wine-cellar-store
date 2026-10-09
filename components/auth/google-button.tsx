"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";

export function GoogleButton({ next }: { next: string }) {
    const toast = useToast();
    const [isPending, setIsPending] = useState(false);

    async function signIn() {
        setIsPending(true);
        const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });

        if (error) {
            setIsPending(false);
            toast.error("Não foi possível entrar com Google", {
                description: getAuthErrorMessage(error),
            });
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={signIn}
                disabled={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
                    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
                    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
                    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
                </svg>
                Continuar com Google
            </button>
            <div className="my-6 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                ou com email
                <span className="h-px flex-1 bg-border" />
            </div>
        </>
    );
}
