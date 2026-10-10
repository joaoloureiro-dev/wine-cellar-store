import "server-only";

import { z } from "zod";

import { deriveStockStatus, euros } from "@/lib/admin/product-schema";
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
        .pipe(z.string().max(max, `${label}: máximo de ${max} caracteres.`));

/** Empty → null; otherwise a number within range ("59,5" accepted). */
const optionalNumber = (label: string, min: number, max: number, { decimals = false } = {}) =>
    z
        .string()
        .optional()
        .transform((value) => (value ?? "").trim().replace(",", "."))
        .refine((value) => value === "" || (decimals ? /^\d+(\.\d+)?$/ : /^\d+$/).test(value), `${label}: indique um número.`)
        .transform((value) => (value === "" ? null : Number(value)))
        .refine((value) => value === null || (value >= min && value <= max), `${label}: entre ${min} e ${max}.`);

const requiredNumber = (label: string, min: number, max: number, options?: { decimals?: boolean }) =>
    optionalNumber(label, min, max, options).refine((value) => value !== null, `${label}: obrigatório.`).transform((value) => value as number);

const celsius = (label: string) =>
    z
        .string()
        .optional()
        .transform((value) => (value ?? "").trim())
        .refine((value) => value === "" || /^-?\d+$/.test(value), `${label}: número inteiro.`)
        .transform((value) => (value === "" ? null : Number(value)))
        .refine((value) => value === null || (value >= -10 && value <= 30), `${label}: entre -10 e 30 °C.`);

/** "" (not specified) | "yes" | "no" → null | true | false. */
const feature = z
    .enum(["", "yes", "no"])
    .optional()
    .transform((value) => (value === "yes" ? true : value === "no" ? false : null));

/** GTIN-8 / GTIN-13 with a valid check digit. */
export function isValidGtin(value: string) {
    if (!/^(\d{8}|\d{13})$/.test(value)) return false;

    const digits = value.split("").map(Number);
    const check = digits.pop()!;
    const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);

    return (10 - (sum % 10)) % 10 === check;
}

export const productKindValues = ["WINE_CELLAR", "CLIMATE_UNIT", "WINE_RACK", "ACCESSORY"] as const;
export type ProductKindValue = (typeof productKindValues)[number];

const detailsShape = {
    name: text(2, 120, "Nome"),
    brandId: z.string({ error: "Escolha a marca." }).regex(/^[a-z0-9-]{1,64}$/i, "Escolha a marca."),
    sku: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9][A-Z0-9_-]{1,39}$/, "SKU: 2 a 40 letras, números, hífen ou _."),
    ean: z
        .string()
        .optional()
        .transform((value) => (value ?? "").replace(/\s/g, ""))
        .refine((value) => value === "" || isValidGtin(value), "EAN inválido (8 ou 13 dígitos com dígito de controlo).")
        .transform((value) => value || null),
    shortDescription: text(10, 200, "Resumo"),
    description: text(20, 4000, "Descrição"),
    /** Fixed after creation; on edit the action uses the stored kind. */
    kind: z.enum(productKindValues).optional().default("WINE_CELLAR"),
    capacity: optionalNumber("Capacidade", 1, 1000),
    zones: z
        .union([z.enum(["1", "2", "3"]), z.literal("")])
        .optional()
        .transform((value) => (value ? Number(value) : null)),
    installationType: z
        .union([z.enum(["FREESTANDING", "BUILT_IN", "UNDERCOUNTER"]), z.literal("")])
        .optional()
        .transform((value) => value || null),
    roomVolumeM3: optionalNumber("Volume da divisão", 1, 2000),
    coolingPowerW: optionalNumber("Potência de frio", 50, 20000),
    material: optionalText(60, "Material"),
    zone1Min: celsius("Zona 1 mín."),
    zone1Max: celsius("Zona 1 máx."),
    zone2Min: celsius("Zona 2 mín."),
    zone2Max: celsius("Zona 2 máx."),
    zone3Min: celsius("Zona 3 mín."),
    zone3Max: celsius("Zona 3 máx."),
    widthCm: optionalNumber("Largura", 1, 300, { decimals: true }),
    heightCm: optionalNumber("Altura", 1, 300, { decimals: true }),
    depthCm: optionalNumber("Profundidade", 1, 300, { decimals: true }),
    weightKg: optionalNumber("Peso", 0.01, 500, { decimals: true }),
    energyClass: z
        .string()
        .optional()
        .transform((value) => (value ?? "").trim().toUpperCase())
        .refine((value) => value === "" || /^[A-G]$/.test(value), "Classe energética de A a G.")
        .transform((value) => value || null),
    annualEnergyKwh: optionalNumber("Consumo anual", 1, 5000),
    noiseDb: optionalNumber("Ruído", 10, 90),
    reversibleDoor: feature,
    uvProtectedGlass: feature,
    ledLighting: feature,
    lock: feature,
    seoTitle: optionalText(70, "Título SEO"),
    seoDescription: optionalText(160, "Descrição SEO"),
    /** Comma-separated ids (the action joins the checked boxes). */
    categoryIds: z
        .string()
        .optional()
        .transform((value) => [...new Set((value ?? "").split(",").filter(Boolean))])
        .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,64}$/i)).max(20, "Máximo de 20 categorias.")),
};

type DetailsShape = z.infer<z.ZodObject<typeof detailsShape>>;

function required<T>(ctx: z.RefinementCtx, value: T | null, path: string, message: string): value is T {
    if (value === null || value === undefined) {
        ctx.addIssue({ code: "custom", path: [path], message });
        return false;
    }
    return true;
}

/** Temperature zones of a cellar: one range per zone, min below max. */
function cellarZones(input: DetailsShape, zoneCount: number, ctx: z.RefinementCtx) {
    const zones: { position: number; minCelsius: number; maxCelsius: number }[] = [];

    for (let position = 1; position <= zoneCount; position += 1) {
        const min = input[`zone${position}Min` as keyof DetailsShape] as number | null;
        const max = input[`zone${position}Max` as keyof DetailsShape] as number | null;

        if (min === null || max === null) {
            ctx.addIssue({ code: "custom", path: [`zone${position}Min`], message: `Indique a temperatura da zona ${position}.` });
        } else if (min >= max) {
            ctx.addIssue({ code: "custom", path: [`zone${position}Max`], message: "A máxima tem de ser superior à mínima." });
        } else {
            zones.push({ position, minCelsius: min, maxCelsius: max });
        }
    }

    return zones;
}

/** Dimensions are required for cellars; for other kinds, all three or none. */
function dimensions(input: DetailsShape, kind: ProductKindValue, ctx: z.RefinementCtx) {
    const values = { widthCm: input.widthCm, heightCm: input.heightCm, depthCm: input.depthCm };
    const given = Object.values(values).filter((value) => value !== null).length;

    if (kind === "WINE_CELLAR" || given > 0) {
        for (const [field, value] of Object.entries(values)) {
            if (value === null) ctx.addIssue({ code: "custom", path: [field], message: kind === "WINE_CELLAR" ? "Obrigatório." : "Indique as três medidas ou nenhuma." });
        }
    }

    const mm = (value: number | null) => (value === null ? null : Math.round(value * 10));
    return given === 3 ? { widthMm: mm(input.widthCm), heightMm: mm(input.heightCm), depthMm: mm(input.depthCm) } : { widthMm: null, heightMm: null, depthMm: null };
}

/** Checks the fields the product's kind requires; builds DB values. */
function finishDetails(input: DetailsShape, ctx: z.RefinementCtx) {
    const kind = input.kind;
    const isCellar = kind === "WINE_CELLAR";
    let zones: { position: number; minCelsius: number; maxCelsius: number }[] = [];
    let seoTitle = input.seoTitle;

    if (isCellar) {
        required(ctx, input.capacity, "capacity", "Capacidade: obrigatório.");
        required(ctx, input.installationType, "installationType", "Escolha o tipo de instalação.");
        if (required(ctx, input.zones, "zones", "Escolha o número de zonas.")) zones = cellarZones(input, input.zones, ctx);
        seoTitle ||= `${input.name} | Cave de Vinho ${input.capacity} Garrafas`;
    } else if (kind === "CLIMATE_UNIT") {
        required(ctx, input.roomVolumeM3, "roomVolumeM3", "Volume da divisão: obrigatório.");
        seoTitle ||= `${input.name} | Climatizador de Adega até ${input.roomVolumeM3} m³`;
    } else if (kind === "WINE_RACK") {
        required(ctx, input.capacity, "capacity", "Capacidade: obrigatório.");
        seoTitle ||= `${input.name} | Garrafeira ${input.capacity} Garrafas`;
    } else {
        seoTitle ||= `${input.name} | Acessórios para Vinho`;
    }

    return {
        kind,
        data: {
            name: input.name,
            brandId: input.brandId,
            sku: input.sku,
            ean: input.ean,
            shortDescription: input.shortDescription,
            description: input.description,
            capacity: isCellar || kind === "WINE_RACK" ? input.capacity : null,
            zones: isCellar ? input.zones : null,
            installationType: isCellar ? input.installationType : null,
            roomVolumeM3: kind === "CLIMATE_UNIT" ? input.roomVolumeM3 : null,
            coolingPowerW: kind === "CLIMATE_UNIT" ? input.coolingPowerW : null,
            material: kind === "WINE_RACK" ? input.material || null : null,
            ...dimensions(input, kind, ctx),
            weightGrams: input.weightKg === null ? null : Math.round(input.weightKg * 1000),
            energyClass: input.energyClass,
            annualEnergyKwh: input.annualEnergyKwh,
            noiseDb: input.noiseDb,
            reversibleDoor: isCellar ? input.reversibleDoor : null,
            uvProtectedGlass: isCellar ? input.uvProtectedGlass : null,
            ledLighting: isCellar ? input.ledLighting : null,
            lock: isCellar ? input.lock : null,
            seoTitle: seoTitle.slice(0, 70),
            seoDescription: input.seoDescription || input.shortDescription.slice(0, 160),
        },
        zones,
        categoryIds: input.categoryIds,
    };
}

/** Editing an existing product (URL, price and stock live elsewhere). */
export const productDetailsSchema = z
    .object({ ...detailsShape, productId: z.string().regex(/^[a-z0-9-]{1,64}$/i), version: z.coerce.number().int().positive() })
    .transform((input, ctx) => ({ productId: input.productId, version: input.version, ...finishDetails(input, ctx) }));

/** Creating a product: details plus URL, initial price and stock. Starts hidden. */
export const productCreateSchema = z
    .object({
        ...detailsShape,
        slug: z.string().trim().toLowerCase().optional(),
        price: euros("o preço").refine((cents) => cents >= 100, "O preço mínimo é 1,00 €."),
        stockQuantity: requiredNumber("Stock", 0, 9999),
    })
    .transform((input, ctx) => {
        const slug = input.slug || slugify(input.name);

        if (!SLUG_PATTERN.test(slug)) {
            ctx.addIssue({ code: "custom", path: ["slug"], message: "Use só letras minúsculas, números e hífenes." });
        }

        const details = finishDetails(input, ctx);

        return {
            ...details,
            data: {
                ...details.data,
                kind: details.kind,
                slug,
                priceCents: input.price,
                stockQuantity: input.stockQuantity,
                stockStatus: deriveStockStatus(input.stockQuantity, "auto"),
                active: false,
            },
        };
    });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductDetailsInput = z.infer<typeof productDetailsSchema>;
