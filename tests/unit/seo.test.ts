import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbNode, productNode } from "@/lib/seo/structured-data";
import type { WineCellarProduct } from "@/types/product";

type Offer = { price: string; priceCurrency: string; availability: string; shippingDetails: { shippingRate: { value: string } }[] };
type ProductJson = { gtin13?: string; url: string; image: string[]; offers: Offer };
type BreadcrumbJson = { itemListElement: { item: string }[] };

const product = {
    id: "p1",
    kind: "wine-cellar",
    slug: "classic-24",
    sku: "CELLAR-CLASSIC-24",
    ean: "5601234567890",
    name: "Classic 24",
    brand: "La Sommelière",
    brandSlug: "la-sommeliere",
    shortDescription: "Cave compacta.",
    price: 499,
    stockStatus: "low_stock",
    images: ["/images/products/classic-24/front.webp"],
} as unknown as WineCellarProduct;

describe("productNode", () => {
    it("publishes price, availability, GTIN and absolute URLs", () => {
        const node = productNode(product) as unknown as ProductJson;

        expect(node.gtin13).toBe("5601234567890");
        expect(node.url).toBe("https://cellarium.test/caves/la-sommeliere/classic-24");
        expect(node.image).toEqual(["https://cellarium.test/images/products/classic-24/front.webp"]);
        expect(node.offers).toMatchObject({
            price: "499.00",
            priceCurrency: "EUR",
            availability: "https://schema.org/LimitedAvailability",
        });
        expect(node.offers.shippingDetails[0].shippingRate.value).toBe("49.00");
    });

    it("omits an invalid EAN and has free shipping above the threshold", () => {
        const node = productNode({ ...product, ean: "123", price: 1499 }) as unknown as ProductJson;

        expect(node.gtin13).toBeUndefined();
        expect(node.offers.shippingDetails[0].shippingRate.value).toBe("0.00");
    });
});

describe("breadcrumbNode", () => {
    it("uses the current path for the last item", () => {
        const node = breadcrumbNode([{ label: "Início", href: "/" }, { label: "Marcas" }], "/marcas") as unknown as BreadcrumbJson;
        expect(node.itemListElement.map((item) => item.item)).toEqual([
            "https://cellarium.test/",
            "https://cellarium.test/marcas",
        ]);
    });
});

describe("JsonLd", () => {
    it("cannot be broken out of by database content", () => {
        const html = renderToStaticMarkup(JsonLd({ data: { name: "</script><script>alert(1)</script>" } }));

        expect(html.match(/<script/g)).toHaveLength(1);
        expect(html).toContain("\\u003c/script>");
    });
});
