import "server-only";

import { db } from "@/lib/db";
import { MAX_FAVORITES, productIdPattern } from "@/lib/favorites/constants";

export async function getFavoriteProductIds(userId: string) {
    const rows = await db.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { productId: true },
    });

    return rows.map((row) => row.productId);
}

/** Keeps only well-formed ids of active products. */
async function existingProductIds(ids: string[]) {
    const valid = [...new Set(ids.filter((id) => productIdPattern.test(id)))].slice(0, MAX_FAVORITES);

    if (valid.length === 0) {
        return [];
    }

    const products = await db.product.findMany({
        where: { id: { in: valid }, active: true },
        select: { id: true },
    });

    return products.map((product) => product.id);
}

export async function setFavorite(userId: string, productId: string, favorite: boolean) {
    if (!favorite) {
        await db.favorite.deleteMany({ where: { userId, productId } });
        return true;
    }

    const [exists] = await existingProductIds([productId]);

    if (!exists) {
        return false;
    }

    const count = await db.favorite.count({ where: { userId } });

    if (count >= MAX_FAVORITES) {
        return false;
    }

    await db.favorite.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId },
        update: {},
    });

    return true;
}

/** Merges favourites saved in the browser before signing in. */
export async function mergeFavorites(userId: string, productIds: string[]) {
    const ids = await existingProductIds(productIds);

    if (ids.length > 0) {
        await db.favorite.createMany({
            data: ids.map((productId) => ({ userId, productId })),
            skipDuplicates: true,
        });
    }

    return getFavoriteProductIds(userId);
}
