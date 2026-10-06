import { getMaxPurchasableQuantity } from "@/lib/cart/availability";
import type { CartLine } from "@/lib/cart/schema";
import type { WineCellarProduct } from "@/types/product";

export type CartItemIssue = "unavailable" | "insufficient_stock";

export type CartItem = {
    product: WineCellarProduct;
    /** Quantity stored in the cart. */
    quantity: number;
    /** Quantity that can actually be bought now (≤ quantity). */
    payableQuantity: number;
    maxQuantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    issue: CartItemIssue | null;
};

export type Cart = {
    items: CartItem[];
    itemCount: number;
    subtotalCents: number;
    /** Savings against `compareAtPrice` (shown, already included in prices). */
    savingsCents: number;
    /** Lines whose product no longer exists in the catalogue. */
    missingProductCount: number;
    hasIssues: boolean;
};

/** All money maths is done in integer cents to avoid floating point drift. */
export function toCents(euros: number) {
    return Math.round(euros * 100);
}

export function buildCart(
    lines: CartLine[],
    products: WineCellarProduct[],
): Cart {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const items: CartItem[] = [];
    let missingProductCount = 0;

    for (const line of lines) {
        const product = productsById.get(line.productId);

        if (!product) {
            missingProductCount += 1;
            continue;
        }

        const maxQuantity = getMaxPurchasableQuantity(product);
        const payableQuantity = Math.min(line.quantity, maxQuantity);
        const unitPriceCents = toCents(product.price);

        items.push({
            product,
            quantity: line.quantity,
            payableQuantity,
            maxQuantity,
            unitPriceCents,
            lineTotalCents: unitPriceCents * payableQuantity,
            issue:
                maxQuantity === 0
                    ? "unavailable"
                    : line.quantity > maxQuantity
                      ? "insufficient_stock"
                      : null,
        });
    }

    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const savingsCents = items.reduce((sum, item) => {
        const { compareAtPrice } = item.product;

        if (!compareAtPrice || compareAtPrice <= item.product.price) {
            return sum;
        }

        return sum + (toCents(compareAtPrice) - item.unitPriceCents) * item.payableQuantity;
    }, 0);

    return {
        items,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        subtotalCents,
        savingsCents,
        missingProductCount,
        hasIssues:
            missingProductCount > 0 || items.some((item) => item.issue !== null),
    };
}
