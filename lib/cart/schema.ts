import { z } from "zod";

import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart/constants";

const productIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/i);

export const cartLineSchema = z.object({
    productId: productIdSchema,
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

export type CartLine = z.infer<typeof cartLineSchema>;

export const addToCartSchema = z.object({
    productId: productIdSchema,
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

export const updateCartItemSchema = z.object({
    productId: productIdSchema,
    quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
});

export const removeFromCartSchema = z.object({
    productId: productIdSchema,
});
