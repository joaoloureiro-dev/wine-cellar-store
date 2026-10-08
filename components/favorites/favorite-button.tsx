"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";

type FavoriteButtonProps = {
    productId: string;
    productName: string;
    variant?: "overlay" | "inline";
};

export function FavoriteButton({ productId, productName, variant = "overlay" }: FavoriteButtonProps) {
    const { isFavorite, toggle, isReady } = useFavorites();
    const active = isReady && isFavorite(productId);
    // Pop only after a click, not when saved favourites load.
    const [hasToggled, setHasToggled] = useState(false);

    return (
        <button
            type="button"
            onClick={() => {
                setHasToggled(true);
                toggle(productId, productName);
            }}
            aria-pressed={active}
            aria-label={active ? `Remover ${productName} dos favoritos` : `Adicionar ${productName} aos favoritos`}
            className={
                variant === "overlay"
                    ? "relative z-10 inline-flex size-10 items-center justify-center rounded-full bg-surface/90 text-charcoal shadow-card backdrop-blur transition-[color,transform] duration-200 ease-cellar hover:scale-105 hover:text-wine motion-reduce:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    : "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-charcoal transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            }
        >
            <Heart
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
                className={active ? `fill-wine text-wine ${hasToggled ? "animate-pop motion-reduce:animate-none" : ""}` : undefined}
            />
        </button>
    );
}
