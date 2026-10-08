import { expect, test } from "@playwright/test";

for (const path of ["/", "/caves", "/caves/la-sommeliere/classic-24", "/marcas", "/guia", "/reservas", "/carrinho", "/entrar"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));

        await page.goto(path);
        const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

        expect(overflows).toBe(false);
        expect(errors).toEqual([]);
    });
}
