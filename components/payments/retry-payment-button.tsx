"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";
import { useTransition } from "react";

import { useToast } from "@/components/ui/toast";
import { retryPayment } from "@/lib/payments/actions";

export function RetryPaymentButton({ reference, label }: { reference: string; label: string }) {
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    function handleClick() {
        startTransition(async () => {
            try {
                const result = await retryPayment(reference);

                // The toast lives in the root layout, so it survives this
                // button unmounting when the page shows the new instructions.
                if (result.ok) {
                    toast.success("Novo pedido de pagamento criado");
                } else {
                    toast.error("Erro no pagamento", { description: result.message });
                }
            } catch (error) {
                // Navigation (e.g. redirect to Klarna) is not an error.
                if (error instanceof Error && error.message === "NEXT_REDIRECT") {
                    throw error;
                }

                toast.error("Ocorreu um erro inesperado", {
                    description: "Não foi possível criar o pagamento. Tente novamente.",
                });
            }
        });
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
        >
            {isPending ? (
                <LoaderCircle size={16} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            ) : (
                <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
            )}
            {label}
        </button>
    );
}
