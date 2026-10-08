import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { brandSchema } from "@/lib/admin/brand-schema";
import { isValidGtin, productCreateSchema, productDetailsSchema } from "@/lib/admin/product-details-schema";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { slugify } from "@/lib/slug";

const details = {
    name: "Vinocave Duo 60",
    brandId: "brand-1",
    sku: "vc-duo-60",
    ean: "4006381333931",
    shortDescription: "Cave de duas zonas para 60 garrafas.",
    description: "Cave de vinho de duas zonas, silenciosa, com prateleiras de madeira.",
    capacity: "60",
    zones: "2",
    installationType: "BUILT_IN",
    zone1Min: "5",
    zone1Max: "12",
    zone2Min: "14",
    zone2Max: "18",
    widthCm: "59,5",
    heightCm: "177",
    depthCm: "56",
    weightKg: "62,4",
    energyClass: "g",
    annualEnergyKwh: "",
    noiseDb: "38",
    reversibleDoor: "yes",
    uvProtectedGlass: "no",
    ledLighting: "",
    lock: "yes",
    seoTitle: "",
    seoDescription: "",
};

const errorPaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
    result.error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("slugify", () => {
    it.each([
        ["La Sommelière", "la-sommeliere"],
        ["  Vinocave  Duo 60! ", "vinocave-duo-60"],
        ["Ação & Côte", "acao-cote"],
    ])("%s → %s", (input, expected) => expect(slugify(input)).toBe(expected));
});

describe("isValidGtin", () => {
    it.each([
        ["4006381333931", true],
        ["4006381333932", false],
        ["96385074", true],
        ["123", false],
        ["400638133393a", false],
    ])("%s → %s", (input, expected) => expect(isValidGtin(input)).toBe(expected));
});

describe("productCreateSchema", () => {
    it("converts units and fills defaults", () => {
        const result = productCreateSchema.safeParse({ ...details, price: "1299,00", stockQuantity: "3" });

        expect(result.success).toBe(true);
        expect(result.data?.zones).toEqual([
            { position: 1, minCelsius: 5, maxCelsius: 12 },
            { position: 2, minCelsius: 14, maxCelsius: 18 },
        ]);
        expect(result.data?.data).toMatchObject({
            slug: "vinocave-duo-60",
            sku: "VC-DUO-60",
            priceCents: 129_900,
            stockQuantity: 3,
            stockStatus: "LOW_STOCK",
            active: false,
            widthMm: 595,
            weightGrams: 62_400,
            energyClass: "G",
            annualEnergyKwh: null,
            reversibleDoor: true,
            uvProtectedGlass: false,
            ledLighting: null,
            seoTitle: "Vinocave Duo 60 | Cave de Vinho 60 Garrafas",
            seoDescription: details.shortDescription,
        });
    });

    it("requires the price, stock and brand", () => {
        const result = productCreateSchema.safeParse({ ...details, brandId: undefined, price: "", stockQuantity: "" });

        expect(errorPaths(result)).toEqual(expect.arrayContaining(["brandId", "price", "stockQuantity"]));
    });

    it("rejects an invalid slug", () => {
        const result = productCreateSchema.safeParse({ ...details, slug: "Não válido!", price: "899", stockQuantity: "1" });

        expect(errorPaths(result)).toContain("slug");
    });
});

describe("productDetailsSchema", () => {
    const edit = { ...details, productId: "product-1", version: "1760000000000" };

    it("only keeps the zones the product has", () => {
        const result = productDetailsSchema.safeParse({ ...edit, zones: "1" });

        expect(result.data?.zones).toEqual([{ position: 1, minCelsius: 5, maxCelsius: 12 }]);
        expect(result.data?.data).not.toHaveProperty("slug");
        expect(result.data?.data).not.toHaveProperty("priceCents");
    });

    it.each([
        [{ zone2Max: "14" }, "zone2Max"],
        [{ zone2Min: "", zone2Max: "" }, "zone2Min"],
        [{ zones: "3" }, "zone3Min"],
        [{ zone1Min: "-20" }, "zone1Min"],
        [{ ean: "4006381333932" }, "ean"],
        [{ energyClass: "H" }, "energyClass"],
        [{ widthCm: "" }, "widthCm"],
        [{ sku: "a" }, "sku"],
        [{ seoTitle: "x".repeat(71) }, "seoTitle"],
    ])("rejects %o", (change, path) => {
        expect(errorPaths(productDetailsSchema.safeParse({ ...edit, ...change }))).toContain(path);
    });
});

describe("brandSchema", () => {
    it("derives the slug from the name", () => {
        const result = brandSchema.safeParse({ name: "Vinoteca Ibérica", country: "Espanha", description: "Caves de vinho ibéricas." });

        expect(result.data?.slug).toBe("vinoteca-iberica");
    });
});

describe("uniqueViolationField", () => {
    const violation = (meta: Record<string, unknown>) =>
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "7", meta });

    it("reads the index reported by the driver adapter", () => {
        const error = violation({
            modelName: "Product",
            driverAdapterError: { name: "DriverAdapterError", cause: { kind: "UniqueConstraintViolation", constraint: { index: "Product_sku_key" } } },
        });

        expect(uniqueViolationField(error)).toBe("sku");
    });

    it("reads the columns reported by the query engine", () => {
        expect(uniqueViolationField(violation({ target: ["ean"] }))).toBe("ean");
    });

    it("ignores other errors", () => {
        expect(uniqueViolationField(new Error("boom"))).toBeNull();
        expect(uniqueViolationField(violation({}))).toBe("_form");
    });
});
