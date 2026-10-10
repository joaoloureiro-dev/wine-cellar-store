import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart/constants";
import type { Product } from "@/types/product";

/**
 * Maximum quantity a customer may put in the cart right now.
 *
 * This is an advisory check for a good UX. The authoritative check
 * (transactional stock reservation) happens at checkout.
 */
export function getMaxPurchasableQuantity(product: Product) {
    const isPurchasable =
        product.active &&
        (product.stockStatus === "in_stock" || product.stockStatus === "low_stock");

    if (!isPurchasable) {
        return 0;
    }

    return Math.max(0, Math.min(product.stockQuantity, MAX_QUANTITY_PER_ITEM));
}

export function getUnavailableMessage(product: Product) {
    return product.stockStatus === "preorder"
        ? "Este produto está disponível apenas por reserva."
        : "Este produto está esgotado.";
}
