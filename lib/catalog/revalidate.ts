import "server-only";

import { revalidatePath } from "next/cache";

import { getProductsByIds } from "@/lib/products";
import { getBrandHref, getProductHref } from "@/lib/routes";

/**
 * Refreshes statically generated pages that show stock for these products
 * (product page, brand page, homepage featured products).
 *
 * Interim solution until tag-based invalidation (Cache stage). Failures are
 * logged, never thrown: a stale page must not fail an order.
 */
export async function revalidateProductPages(productIds: string[]) {
    try {
        const products = await getProductsByIds(productIds);
        const paths = new Set<string>(["/"]);

        for (const product of products) {
            paths.add(getProductHref(product));
            paths.add(getBrandHref(product.brandSlug));
        }

        for (const path of paths) {
            revalidatePath(path);
        }
    } catch (error) {
        console.error("[catalog] Failed to revalidate product pages", error);
    }
}
