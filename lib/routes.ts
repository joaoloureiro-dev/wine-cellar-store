import { slugify } from "@/lib/slug";
import type { WineCellarBrand, WineCellarProduct } from "@/types/product";

export function getBrandSlug(brand: WineCellarBrand) {
    return slugify(brand);
}

export function getBrandHref(brand: WineCellarBrand) {
    return `/marcas/${getBrandSlug(brand)}`;
}

export function getProductHref(product: Pick<WineCellarProduct, "brand" | "slug">) {
    return `/caves/${getBrandSlug(product.brand)}/${product.slug}`;
}
