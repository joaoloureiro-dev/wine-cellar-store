import type { ProductKind } from "@/types/product";

/** Listing and product URL prefix per kind. Wine cellars keep /caves. */
export const kindPaths: Record<ProductKind, string> = {
    "wine-cellar": "/caves",
    "climate-unit": "/climatizadores",
    "wine-rack": "/garrafeiras",
    accessory: "/acessorios",
};

export function getBrandHref(brandSlug: string) {
    return `/marcas/${brandSlug}`;
}

export function getCategoryHref(categorySlug: string) {
    return `/categorias/${categorySlug}`;
}

/** The kind as stored in the database (Prisma enum). */
type StoredKind = "WINE_CELLAR" | "CLIMATE_UNIT" | "WINE_RACK" | "ACCESSORY";

export const kindFromStored: Record<StoredKind, ProductKind> = {
    WINE_CELLAR: "wine-cellar",
    CLIMATE_UNIT: "climate-unit",
    WINE_RACK: "wine-rack",
    ACCESSORY: "accessory",
};

/** Accepts the domain kind or the stored one; defaults to a wine cellar. */
export function getProductHref(product: { brandSlug: string; slug: string; kind?: ProductKind | StoredKind }) {
    const kind = product.kind ? (kindFromStored[product.kind as StoredKind] ?? (product.kind as ProductKind)) : "wine-cellar";
    return `${kindPaths[kind]}/${product.brandSlug}/${product.slug}`;
}
