"use server";

import {
    getMaxPurchasableQuantity,
    getUnavailableMessage,
} from "@/lib/cart/availability";
import { MAX_CART_LINES } from "@/lib/cart/constants";
import {
    addToCartSchema,
    removeFromCartSchema,
    updateCartItemSchema,
    type CartLine,
} from "@/lib/cart/schema";
import { readCartLines, writeCartLines } from "@/lib/cart/storage";
import { getProductById, getProductsByIds } from "@/lib/products";

/**
 * Cart Server Actions.
 *
 * Every input is validated with Zod and every quantity is checked against
 * the server's product data; the client is never trusted for prices or
 * stock. Next.js protects Server Actions against CSRF (POST only + Origin
 * check). Setting the cart cookie re-renders the current page.
 */

export type CartActionResult = {
    status: "success" | "warning" | "error";
    message: string;
    itemCount: number;
};

function countItems(lines: CartLine[]) {
    return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Drops lines whose product no longer exists before persisting. */
async function saveLines(lines: CartLine[]) {
    const products = await getProductsByIds(lines.map((line) => line.productId));
    const existingIds = new Set(products.map((product) => product.id));
    const validLines = lines.filter((line) => existingIds.has(line.productId));

    await writeCartLines(validLines);

    return validLines;
}

async function invalidRequest(): Promise<CartActionResult> {
    return {
        status: "error",
        message: "Pedido inválido. Atualize a página e tente novamente.",
        itemCount: countItems(await readCartLines()),
    };
}

export async function addToCart(input: unknown): Promise<CartActionResult> {
    const parsed = addToCartSchema.safeParse(input);

    if (!parsed.success) {
        return invalidRequest();
    }

    const { productId, quantity } = parsed.data;
    const [product, lines] = await Promise.all([
        getProductById(productId),
        readCartLines(),
    ]);

    if (!product) {
        return {
            status: "error",
            message: "Este produto já não está disponível.",
            itemCount: countItems(lines),
        };
    }

    const maxQuantity = getMaxPurchasableQuantity(product);

    if (maxQuantity === 0) {
        return {
            status: "error",
            message: getUnavailableMessage(product),
            itemCount: countItems(lines),
        };
    }

    const existing = lines.find((line) => line.productId === productId);
    const currentQuantity = existing?.quantity ?? 0;

    if (currentQuantity >= maxQuantity) {
        return {
            status: "warning",
            message: `Já tem no carrinho todas as unidades disponíveis (${maxQuantity}).`,
            itemCount: countItems(lines),
        };
    }

    if (!existing && lines.length >= MAX_CART_LINES) {
        return {
            status: "error",
            message: "O carrinho atingiu o número máximo de produtos diferentes.",
            itemCount: countItems(lines),
        };
    }

    const newQuantity = Math.min(currentQuantity + quantity, maxQuantity);
    const added = newQuantity - currentQuantity;
    const nextLines = existing
        ? lines.map((line) =>
              line.productId === productId ? { ...line, quantity: newQuantity } : line,
          )
        : [...lines, { productId, quantity: newQuantity }];

    const savedLines = await saveLines(nextLines);

    if (added < quantity) {
        return {
            status: "warning",
            message: `Adicionámos ${added} ${added === 1 ? "unidade" : "unidades"}, o máximo disponível.`,
            itemCount: countItems(savedLines),
        };
    }

    return {
        status: "success",
        message: "Produto adicionado ao carrinho",
        itemCount: countItems(savedLines),
    };
}

export async function updateCartItemQuantity(
    input: unknown,
): Promise<CartActionResult> {
    const parsed = updateCartItemSchema.safeParse(input);

    if (!parsed.success) {
        return invalidRequest();
    }

    const { productId, quantity } = parsed.data;

    if (quantity === 0) {
        return removeFromCart({ productId });
    }

    const [product, lines] = await Promise.all([
        getProductById(productId),
        readCartLines(),
    ]);
    const maxQuantity = product ? getMaxPurchasableQuantity(product) : 0;

    if (!product || maxQuantity === 0) {
        const savedLines = await saveLines(
            lines.filter((line) => line.productId !== productId),
        );

        return {
            status: "error",
            message: product
                ? `${getUnavailableMessage(product)} Foi removido do carrinho.`
                : "Este produto já não está disponível e foi removido do carrinho.",
            itemCount: countItems(savedLines),
        };
    }

    const newQuantity = Math.min(quantity, maxQuantity);
    const savedLines = await saveLines(
        lines.some((line) => line.productId === productId)
            ? lines.map((line) =>
                  line.productId === productId ? { ...line, quantity: newQuantity } : line,
              )
            : lines,
    );

    if (newQuantity < quantity) {
        return {
            status: "warning",
            message: `Só temos ${maxQuantity} ${maxQuantity === 1 ? "unidade disponível" : "unidades disponíveis"}.`,
            itemCount: countItems(savedLines),
        };
    }

    return {
        status: "success",
        message: "Quantidade atualizada",
        itemCount: countItems(savedLines),
    };
}

export async function removeFromCart(input: unknown): Promise<CartActionResult> {
    const parsed = removeFromCartSchema.safeParse(input);

    if (!parsed.success) {
        return invalidRequest();
    }

    const lines = await readCartLines();
    const savedLines = await saveLines(
        lines.filter((line) => line.productId !== parsed.data.productId),
    );

    return {
        status: "success",
        message: "Produto removido do carrinho",
        itemCount: countItems(savedLines),
    };
}
