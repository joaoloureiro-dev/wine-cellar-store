"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
    const router = useRouter();
    const toast = useToast();
    const [isPending, setIsPending] = useState(false);

    async function signOut() {
        setIsPending(true);
        await authClient.signOut();
        toast.info("Sessão terminada");
        router.replace("/");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={signOut}
            disabled={isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
        >
            <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
            Terminar sessão
        </button>
    );
}
