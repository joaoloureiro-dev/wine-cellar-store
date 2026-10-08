import { z } from "zod";

import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { sanitizeText } from "@/lib/validation/fields";

const text = (min: number, max: number, label: string) =>
    z
        .string()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(min, `${label}: mínimo de ${min} caracteres.`)
                .max(max, `${label}: máximo de ${max} caracteres.`),
        );

export const brandSchema = z
    .object({
        name: text(2, 80, "Nome"),
        slug: z.string().trim().toLowerCase().optional(),
        country: text(2, 60, "País"),
        description: text(10, 600, "Descrição"),
    })
    .transform((brand) => ({ ...brand, slug: brand.slug || slugify(brand.name) }))
    .refine((brand) => SLUG_PATTERN.test(brand.slug) && brand.slug.length <= 60, {
        path: ["slug"],
        message: "Use só letras minúsculas, números e hífenes (ex.: la-sommeliere).",
    });

export type BrandInput = z.infer<typeof brandSchema>;
