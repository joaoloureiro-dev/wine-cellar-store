import type { MetadataRoute } from "next";

import { getBrands } from "@/lib/brands";
import { getActiveProducts } from "@/lib/products";
import { getBrandHref, getProductHref } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Public, indexable pages. Built from the cached catalogue, so it follows
 * the "catalog" tag: products added, hidden or changed appear here on the
 * next request.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, brands] = await Promise.all([getActiveProducts(), getBrands()]);
    const latestProductUpdate = products.reduce<string | undefined>(
        (latest, product) => (!latest || product.updatedAt > latest ? product.updatedAt : latest),
        undefined,
    );

    return [
        { url: absoluteUrl("/"), lastModified: latestProductUpdate, changeFrequency: "weekly", priority: 1 },
        { url: absoluteUrl("/caves"), lastModified: latestProductUpdate, changeFrequency: "daily", priority: 0.9 },
        { url: absoluteUrl("/marcas"), changeFrequency: "monthly", priority: 0.6 },
        { url: absoluteUrl("/reservas"), changeFrequency: "yearly", priority: 0.4 },
        ...brands.map((brand) => ({
            url: absoluteUrl(getBrandHref(brand.slug)),
            changeFrequency: "monthly" as const,
            priority: 0.6,
        })),
        ...products.map((product) => ({
            url: absoluteUrl(getProductHref(product)),
            lastModified: product.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
            images: product.images.map((image) => absoluteUrl(image)),
        })),
    ];
}
