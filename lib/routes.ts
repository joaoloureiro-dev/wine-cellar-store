import type { WineCellarProduct } from "@/types/product";

export function getBrandHref(brandSlug: string) {
    return `/marcas/${brandSlug}`;
}

export function getCategoryHref(categorySlug: string) {
    return `/categorias/${categorySlug}`;
}

export function getProductHref(
    product: Pick<WineCellarProduct, "brandSlug" | "slug">,
) {
    return `/caves/${product.brandSlug}/${product.slug}`;
}
