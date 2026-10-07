import { describe, expect, it } from "vitest";

import { listHref, parseListParams } from "@/lib/admin/list-params";
import { deriveStockStatus, productUpdateSchema } from "@/lib/admin/product-schema";

const base = {
    productId: "cellar-001",
    version: "1760000000000",
    compareAtPrice: "",
    stockQuantity: "4",
    availability: "auto",
    active: "on",
};

describe("productUpdateSchema", () => {
    it.each([
        ["899", 89_900],
        ["899,00", 89_900],
        ["1 299,90 €", 129_990],
        ["479.9", 47_990],
    ])("parses the price %s", (price, cents) => {
        const parsed = productUpdateSchema.parse({ ...base, price });
        expect(parsed.price).toBe(cents);
        expect(parsed.active).toBe(true);
        expect(parsed.featured).toBe(false);
    });

    it("rejects invalid prices, negative stock and a previous price not above the price", () => {
        expect(productUpdateSchema.safeParse({ ...base, price: "abc" }).success).toBe(false);
        expect(productUpdateSchema.safeParse({ ...base, price: "0,50" }).success).toBe(false);
        expect(productUpdateSchema.safeParse({ ...base, price: "500", stockQuantity: "-1" }).success).toBe(false);
        expect(productUpdateSchema.safeParse({ ...base, price: "500", compareAtPrice: "500" }).success).toBe(false);
        expect(productUpdateSchema.safeParse({ ...base, price: "500", compareAtPrice: "650" }).success).toBe(true);
    });
});

describe("deriveStockStatus", () => {
    it("follows the same thresholds as the stock statements", () => {
        expect(deriveStockStatus(0, "auto")).toBe("OUT_OF_STOCK");
        expect(deriveStockStatus(3, "auto")).toBe("LOW_STOCK");
        expect(deriveStockStatus(4, "auto")).toBe("IN_STOCK");
        expect(deriveStockStatus(0, "PREORDER")).toBe("PREORDER");
    });
});

describe("list params", () => {
    const statuses = ["PAID", "SHIPPED"] as const;

    it("ignores unknown statuses and bad pages", () => {
        expect(parseListParams({ estado: "NOPE", pagina: "-2", q: "  " }, statuses)).toEqual({
            status: undefined,
            q: undefined,
            page: 1,
        });
        expect(parseListParams({ estado: "PAID", pagina: "3", q: " ENC-1 " }, statuses)).toEqual({
            status: "PAID",
            q: "ENC-1",
            page: 3,
        });
    });

    it("builds list URLs keeping filters", () => {
        expect(listHref("/admin/encomendas", { status: "PAID", q: "ana", page: 2 })).toBe(
            "/admin/encomendas?estado=PAID&q=ana&pagina=2",
        );
        expect(listHref("/admin/encomendas", { page: 1 })).toBe("/admin/encomendas");
    });
});
