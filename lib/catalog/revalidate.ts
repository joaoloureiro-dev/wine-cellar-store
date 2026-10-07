import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getBrandHref, getProductHref } from "@/lib/routes";

/**
 * Refreshes statically generated pages that show stock for these products
 * (product page, brand page, homepage featured products). Includes hidden
 * products, so a product taken off sale disappears immediately.
 *
 * Interim solution until tag-based invalidation (Cache stage). Failures are
 * logged, never thrown: a stale page must not fail an order.
 */
export async function revalidateProductPages(productIds: string[]) {
    try {
        const products = await db.product.findMany({
            where: { id: { in: productIds } },
            select: { slug: true, brand: { select: { slug: true } } },
        });
        const paths = new Set<string>(["/", "/marcas"]);

        for (const product of products) {
            paths.add(getProductHref({ slug: product.slug, brandSlug: product.brand.slug }));
            paths.add(getBrandHref(product.brand.slug));
        }

        for (const path of paths) {
            revalidatePath(path);
        }
    } catch (error) {
        console.error("[catalog] Failed to revalidate product pages", error);
    }
}
