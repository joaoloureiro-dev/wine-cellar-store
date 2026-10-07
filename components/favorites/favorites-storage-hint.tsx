"use client";

import Link from "next/link";

import { useFavorites } from "@/components/favorites/favorites-provider";

/** Tells guests where their favourites live; hidden once signed in. */
export function FavoritesStorageHint() {
    const { isReady, isSignedIn } = useFavorites();

    if (!isReady || isSignedIn) return null;

    return (
        <p className="max-w-xs leading-relaxed">
            Sem sessão iniciada ficam guardados neste browser.{" "}
            <Link href="/entrar?next=%2Ffavoritos" className="font-semibold text-wine underline underline-offset-4">
                Entrar para guardar na conta
            </Link>
        </p>
    );
}
