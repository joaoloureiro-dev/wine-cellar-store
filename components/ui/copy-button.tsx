"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";

type CopyButtonProps = {
    value: string;
    /** What is being copied, e.g. "IBAN" (used in labels and the toast). */
    label: string;
};

export function CopyButton({ value, label }: CopyButtonProps) {
    const toast = useToast();
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
            setCopied(true);
            toast.success("Copiado", { description: label });
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Não foi possível copiar", {
                description: `Selecione e copie o valor (${label}) manualmente.`,
            });
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={`Copiar ${label}`}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-charcoal focus-visible:outline-2 focus-visible:outline-wine"
        >
            {copied ? (
                <Check size={16} strokeWidth={2} aria-hidden="true" className="text-success" />
            ) : (
                <Copy size={16} strokeWidth={1.8} aria-hidden="true" />
            )}
        </button>
    );
}
