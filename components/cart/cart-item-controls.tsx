"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { useCartAction } from "@/components/cart/use-cart-action";
import { removeFromCart, updateCartItemQuantity } from "@/lib/cart/actions";

type CartItemControlsProps = {
    productId: string;
    productName: string;
    quantity: number;
    maxQuantity: number;
};

export function CartItemControls({
    productId,
    productName,
    quantity,
    maxQuantity,
}: CartItemControlsProps) {
    const { run, isPending } = useCartAction();
    const isUnavailable = maxQuantity === 0;

    function setQuantity(nextQuantity: number) {
        run(() => updateCartItemQuantity({ productId, quantity: nextQuantity }), {
            toastOnSuccess: false,
        });
    }

    function remove() {
        run(() => removeFromCart({ productId }), {
            successOptions: { description: productName },
        });
    }

    const stepButton =
        "inline-flex size-10 items-center justify-center text-charcoal transition-colors hover:bg-surface-muted focus-visible:relative focus-visible:outline-2 focus-visible:outline-wine disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-busy={isPending}>
            {!isUnavailable && (
                <div className="inline-flex items-center rounded-md border border-border bg-surface">
                    <button
                        type="button"
                        onClick={() => setQuantity(quantity - 1)}
                        disabled={isPending || quantity <= 1}
                        aria-label={`Diminuir quantidade de ${productName}`}
                        className={`${stepButton} rounded-l-md`}
                    >
                        <Minus size={16} strokeWidth={1.8} />
                    </button>

                    <span
                        aria-live="polite"
                        className={`min-w-8 text-center text-sm font-semibold text-charcoal ${isPending ? "opacity-50" : ""}`}
                    >
                        <span className="sr-only">Quantidade: </span>
                        {quantity}
                    </span>

                    <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={isPending || quantity >= maxQuantity}
                        aria-label={`Aumentar quantidade de ${productName}`}
                        className={`${stepButton} rounded-r-md`}
                    >
                        <Plus size={16} strokeWidth={1.8} />
                    </button>
                </div>
            )}

            {!isUnavailable && quantity > maxQuantity && (
                <button
                    type="button"
                    onClick={() => setQuantity(maxQuantity)}
                    disabled={isPending}
                    className="inline-flex min-h-10 items-center rounded-md px-2 text-xs font-semibold text-wine underline underline-offset-4 hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-50"
                >
                    Ajustar para {maxQuantity}
                </button>
            )}

            <button
                type="button"
                onClick={remove}
                disabled={isPending}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-50"
            >
                <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                Remover
                <span className="sr-only"> {productName}</span>
            </button>
        </div>
    );
}
