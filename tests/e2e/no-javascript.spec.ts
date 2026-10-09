import { expect, test } from "@playwright/test";

/**
 * Browsing and buying must work without JavaScript. Content streamed
 * behind a Suspense boundary is revealed by a script, so public pages must
 * not leave any of it hidden in the HTML.
 */
test.use({ javaScriptEnabled: false });

for (const path of ["/", "/caves", "/caves?zonas=2", "/caves/la-sommeliere/classic-24", "/marcas", "/categorias/caves-de-servico", "/guia", "/pesquisa?q=classic", "/carrinho", "/reservas"]) {
    test(`${path} renders without streamed-hidden content`, async ({ request }) => {
        const html = await (await request.get(path)).text();

        expect(html).not.toMatch(/<div hidden id="S:\d+"/);
    });
}

test("filters the catalogue without JavaScript", async ({ page }) => {
    await page.goto("/caves");
    await page.getByRole("checkbox", { name: /2 zonas/ }).first().check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(page).toHaveURL(/zonas=2/);
    await expect(page.getByRole("link", { name: /Dual Zone 45/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Classic 24/ })).toHaveCount(0);
});

test("searches without JavaScript", async ({ page }) => {
    await page.goto("/pesquisa");
    await page.getByRole("searchbox", { name: "Pesquisar caves de vinho" }).fill("sommelière");
    await page.getByRole("button", { name: "Pesquisar" }).click();

    await expect(page.getByText("1 modelo para «sommelière»")).toBeVisible();
    await expect(page.getByRole("link", { name: /Classic 24/ }).first()).toBeVisible();
});
