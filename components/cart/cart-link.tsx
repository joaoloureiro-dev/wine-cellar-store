"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useSyncExternalStore } from "react";

import { CART_UPDATED_EVENT, readCartCountCookie } from "@/lib/cart/events";

function subscribe(onChange: () => void) {
    // Same-tab mutations dispatch CART_UPDATED_EVENT; focus/visibility
    // catches changes made in another tab.
    window.addEventListener(CART_UPDATED_EVENT, onChange);
    window.addEventListener("focus", onChange);
    document.addEventListener("visibilitychange", onChange);

    return () => {
        window.removeEventListener(CART_UPDATED_EVENT, onChange);
        window.removeEventListener("focus", onChange);
        document.removeEventListener("visibilitychange", onChange);
    };
}

type CartLinkProps = {
    className?: string;
};

export function CartLink({ className = "" }: CartLinkProps) {
    // Server snapshot is 0: pages stay static and the badge appears after
    // hydration from the readable count cookie.
    const count = useSyncExternalStore(subscribe, readCartCountCookie, () => 0);

    const label =
        count > 0
            ? `Carrinho, ${count} ${count === 1 ? "artigo" : "artigos"}`
            : "Carrinho";

    return (
        <Link href="/carrinho" aria-label={label} className={`relative ${className}`}>
            <ShoppingBag size={20} strokeWidth={1.8} aria-hidden="true" />

            {count > 0 && (
                // Keyed by the count so the badge re-mounts and bumps
                // whenever an item is added or removed.
                <span
                    key={count}
                    aria-hidden="true"
                    className="absolute right-0.5 top-0.5 flex min-w-[1.125rem] animate-bump items-center justify-center rounded-full bg-wine px-1 text-[10px] font-bold leading-[1.125rem] text-white ring-2 ring-background motion-reduce:animate-none"
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}
