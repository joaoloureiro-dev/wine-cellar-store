import { z } from "zod";

import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { sanitizeText } from "@/lib/validation/fields";

const text = (min: number, max: number, label: string) =>
    z
        .string()
        .transform(sanitizeText)
        .pipe(z.string().min(min, `${label}: mínimo de ${min} caracteres.`).max(max, `${label}: máximo de ${max} caracteres.`));

const optionalText = (max: number, label: string) =>
    z
        .string()
        .optional()
        .transform((value) => sanitizeText(value ?? ""))
        .pipe(z.string().max(max, `${label}: máximo de ${max} caracteres.`))
        .transform((value) => value || null);

export const categorySchema = z
    .object({
        name: text(2, 60, "Nome"),
        slug: z.string().trim().toLowerCase().optional(),
        description: text(10, 600, "Descrição"),
        kind: z.enum(["WINE_CELLAR", "CLIMATE_UNIT", "WINE_RACK", "ACCESSORY"]).optional().default("WINE_CELLAR"),
        position: z
            .string()
            .optional()
            .transform((value) => (value ?? "").trim())
            .refine((value) => value === "" || /^\d{1,3}$/.test(value), "Ordem: número de 0 a 999.")
            .transform((value) => (value === "" ? 0 : Number(value))),
        seoTitle: optionalText(70, "Título SEO"),
        seoDescription: optionalText(160, "Descrição SEO"),
    })
    .transform((category) => ({ ...category, slug: category.slug || slugify(category.name) }))
    .refine((category) => SLUG_PATTERN.test(category.slug) && category.slug.length <= 60, {
        path: ["slug"],
        message: "Use só letras minúsculas, números e hífenes (ex.: caves-de-servico).",
    });

export type CategoryInput = z.infer<typeof categorySchema>;
