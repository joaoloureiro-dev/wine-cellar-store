import "server-only";

import { buildCart, type Cart } from "@/lib/cart/cart";
import { readCartLines } from "@/lib/cart/storage";
import { getProductsByIds } from "@/lib/products";

export async function getCart(): Promise<Cart> {
    const lines = await readCartLines();
    const products = await getProductsByIds(lines.map((line) => line.productId));

    return buildCart(lines, products);
}
