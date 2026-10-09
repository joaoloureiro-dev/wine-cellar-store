"use client";

import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { useCartAction } from "@/components/cart/use-cart-action";
import { buttonStyles } from "@/components/ui/button-styles";
import { addToCart } from "@/lib/cart/actions";

type AddToCartFormProps = {
    productId: string;
    productName: string;
    maxQuantity: number;
    unavailableLabel: string;
};

export function AddToCartForm({
    productId,
    productName,
    maxQuantity,
    unavailableLabel,
}: AddToCartFormProps) {
    const [quantity, setQuantity] = useState(1);
    const { run, isPending } = useCartAction();
    const isAvailable = maxQuantity > 0;

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        run(() => addToCart({ productId, quantity }), {
            successOptions: {
                description: quantity > 1 ? `${productName} × ${quantity}` : productName,
                action: { label: "Ver carrinho", href: "/carrinho" },
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            {isAvailable && (
                <label className="shrink-0">
                    <span className="sr-only">Quantidade</span>
                    <select
                        value={quantity}
                        onChange={(event) => setQuantity(Number(event.target.value))}
                        disabled={isPending}
                        className="h-12 cursor-pointer rounded-full border border-border bg-surface px-4 text-sm font-semibold text-charcoal transition-colors hover:border-champagne focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30"
                    >
                        {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
                            (value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ),
                        )}
                    </select>
                </label>
            )}

            <button
                type="submit"
                disabled={!isAvailable || isPending}
                aria-busy={isPending}
                className={buttonStyles({ className: "flex-1 whitespace-nowrap px-4 disabled:cursor-not-allowed sm:px-6" })}
            >
                {isPending ? (
                    <LoaderCircle
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="animate-spin motion-reduce:animate-none"
                    />
                ) : (
                    <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
                )}
                {isAvailable ? "Adicionar ao carrinho" : unavailableLabel}
            </button>
        </form>
    );
}
