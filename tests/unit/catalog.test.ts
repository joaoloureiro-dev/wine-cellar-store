import { describe, expect, it } from "vitest";

import { calculateShippingCents, shippingMethods } from "@/lib/checkout/shipping";
import { countActiveFilters, parseCatalogQuery, toCatalogSearchParams } from "@/lib/catalog/query";

const brandSlugs = ["avintage", "climadiff", "la-sommeliere"];

describe("parseCatalogQuery", () => {
    it("keeps valid filters and drops unknown values", () => {
        const query = parseCatalogQuery(
            { marca: ["avintage", "unknown"], zonas: ["2", "9"], classe: ["a", "Z"], ordenar: "nope" },
            { brandSlugs },
        );

        expect(query.brands).toEqual(["avintage"]);
        expect(query.zones).toEqual([2]);
        expect(query.energyClasses).toEqual(["A"]);
        expect(query.sort).toBe("relevancia");
    });

    it("swaps an inverted price range and ignores garbage numbers", () => {
        expect(parseCatalogQuery({ preco_min: "900", preco_max: "300" }, { brandSlugs })).toMatchObject({
            minPrice: 300,
            maxPrice: 900,
        });
        expect(parseCatalogQuery({ preco_min: "-1", ruido_max: "abc" }, { brandSlugs })).toMatchObject({
            minPrice: undefined,
            maxNoise: undefined,
        });
    });

    it("round-trips through the URL and counts active filters", () => {
        const query = parseCatalogQuery({ marca: "climadiff", disponibilidade: "em-stock" }, { brandSlugs });
        const again = parseCatalogQuery(Object.fromEntries(toCatalogSearchParams(query)), { brandSlugs });

        expect(again).toEqual(query);
        expect(countActiveFilters(query)).toBe(2);
    });

    it("never throws on hostile input", () => {
        expect(() =>
            parseCatalogQuery({ marca: Array(500).fill("x"), temp_min: "<script>", ordenar: ["a", "b"] }, { brandSlugs }),
        ).not.toThrow();
    });
});

describe("shipping", () => {
    const [homeDelivery] = shippingMethods;

    it("charges below the free-shipping threshold and is free from it", () => {
        expect(calculateShippingCents(homeDelivery, 99_999)).toBe(homeDelivery.priceCents);
        expect(calculateShippingCents(homeDelivery, 100_000)).toBe(0);
    });
});
