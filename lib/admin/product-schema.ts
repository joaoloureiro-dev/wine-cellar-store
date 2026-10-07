import "server-only";

import { z } from "zod";

import { LOW_STOCK_THRESHOLD } from "@/lib/orders/stock";

/** "1 299,90" | "1299.9" | "899" → cents. */
const euros = (label: string) =>
    z
        .string()
        .transform((value) => value.replace(/[\s €]/g, "").replace(",", "."))
        .pipe(z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, `Indique ${label} em euros, por exemplo 899,00.`))
        .transform((value) => Math.round(Number(value) * 100));

export const productUpdateSchema = z
    .object({
        productId: z.string().regex(/^[a-z0-9-]{1,64}$/i),
        version: z.coerce.number().int().positive(),
        price: euros("o preço").refine((cents) => cents >= 100, "O preço mínimo é 1,00 €."),
        compareAtPrice: z.union([z.literal("").transform(() => null), euros("o preço anterior")]),
        stockQuantity: z.coerce
            .number({ error: "Indique um número inteiro." })
            .int("Indique um número inteiro.")
            .min(0, "O stock não pode ser negativo.")
            .max(9999, "Máximo de 9999 unidades."),
        availability: z.enum(["auto", "PREORDER"]),
        active: z.literal("on").optional().transform(Boolean),
        featured: z.literal("on").optional().transform(Boolean),
    })
    .refine((input) => input.compareAtPrice === null || input.compareAtPrice > input.price, {
        path: ["compareAtPrice"],
        message: "O preço anterior tem de ser superior ao preço atual.",
    });

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductField = "price" | "compareAtPrice" | "stockQuantity" | "availability";

/** Same rules as the stock hold/release statements. */
export function deriveStockStatus(stockQuantity: number, availability: "auto" | "PREORDER") {
    if (availability === "PREORDER") return "PREORDER" as const;
    if (stockQuantity === 0) return "OUT_OF_STOCK" as const;
    if (stockQuantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK" as const;
    return "IN_STOCK" as const;
}
