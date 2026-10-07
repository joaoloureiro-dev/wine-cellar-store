"use server";

import { getSession } from "@/lib/auth/session";
import { productIdPattern } from "@/lib/favorites/constants";
import { mergeFavorites, setFavorite } from "@/lib/favorites/service";

export async function setFavoriteAction(productId: string, favorite: boolean) {
    const session = await getSession();

    if (!session || typeof productId !== "string" || !productIdPattern.test(productId)) {
        return { ok: false };
    }

    return { ok: await setFavorite(session.user.id, productId, favorite === true) };
}

export async function mergeFavoritesAction(productIds: string[]) {
    const session = await getSession();

    if (!session || !Array.isArray(productIds)) {
        return null;
    }

    return mergeFavorites(
        session.user.id,
        productIds.filter((id): id is string => typeof id === "string"),
    );
}
