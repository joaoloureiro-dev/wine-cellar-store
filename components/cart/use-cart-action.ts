"use client";

import { useTransition } from "react";

import { useToast, type ToastOptions } from "@/components/ui/toast";
import type { CartActionResult } from "@/lib/cart/actions";
import { notifyCartUpdated } from "@/lib/cart/events";

type RunOptions = {
    /** Show a toast for successful results (warnings/errors always show). */
    toastOnSuccess?: boolean;
    successOptions?: ToastOptions;
};

/**
 * Runs a cart Server Action in a transition and turns its result into the
 * right toast. Unexpected failures (network, server error) show a generic
 * error toast instead of breaking the page.
 */
export function useCartAction() {
    const toast = useToast();
    const [isPending, startTransition] = useTransition();

    function run(
        action: () => Promise<CartActionResult>,
        { toastOnSuccess = true, successOptions }: RunOptions = {},
    ) {
        startTransition(async () => {
            try {
                const result = await action();

                if (result.status === "success") {
                    if (toastOnSuccess) {
                        toast.success(result.message, successOptions);
                    }
                } else if (result.status === "warning") {
                    toast.warning(result.message);
                } else {
                    toast.error(result.message);
                }
            } catch {
                toast.error("Ocorreu um erro inesperado", {
                    description: "Não foi possível atualizar o carrinho. Tente novamente.",
                });
            } finally {
                notifyCartUpdated();
            }
        });
    }

    return { run, isPending };
}
