import { expect, test } from "@playwright/test";

test("product pages expose canonical URL and Product structured data", async ({ page }) => {
    await page.goto("/caves/la-sommeliere/classic-24");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/caves\/la-sommeliere\/classic-24$/);
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}");
    const product = jsonLd["@graph"].find((node: { "@type": string }) => node["@type"] === "Product");

    expect(product.offers.priceCurrency).toBe("EUR");
    expect(product.offers.availability).toMatch(/^https:\/\/schema\.org\//);
});

test("robots, sitemap and status codes", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /checkout");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/caves/la-sommeliere/classic-24");
    expect((await request.get("/caves/la-sommeliere/nao-existe")).status()).toBe(404);
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toBe("image/png");
});
