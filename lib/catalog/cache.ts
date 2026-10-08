import "server-only";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";

/**
 * Cache tags for catalogue data.
 *
 * Every product read (lists, product pages, cart lookups, brand counts)
 * carries CATALOG_TAG, so any change to price, stock or visibility
 * refreshes all of them at once. Brand copy changes far less often and has
 * its own tag.
 */
export const CATALOG_TAG = "catalog";
export const BRANDS_TAG = "brands";

/** Call at the top of a 'use cache' scope that reads products. */
export function cacheCatalogData() {
    cacheLife("hours");
    cacheTag(CATALOG_TAG);
}

/** Call at the top of a 'use cache' scope that reads brands. */
export function cacheBrandData() {
    cacheLife("days");
    cacheTag(BRANDS_TAG);
}

/**
 * Expires catalogue caches after stock, price or visibility changes.
 * `expire: 0` means the next request waits for fresh data instead of being
 * served stale stock (works from Server Actions and Route Handlers alike).
 */
export function invalidateCatalog() {
    revalidateTag(CATALOG_TAG, { expire: 0 });
}

/** Expires brand caches (name, country or description changed, brand added). */
export function invalidateBrands() {
    revalidateTag(BRANDS_TAG, { expire: 0 });
}
