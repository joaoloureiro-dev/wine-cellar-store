import { expect, test } from "@playwright/test";

import { addToCart, signIn } from "./helpers";

test("climate units have their own listing and product page, and can be bought", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Climatizadores" }).click();
    await expect(page).toHaveURL(/\/climatizadores$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Climatizadores de adega");
    // Cellars stay in /caves.
    await expect(page.getByRole("link", { name: /Classic 24/ })).toHaveCount(0);

    await page.getByRole("link", { name: /Wine Room 25/ }).first().click();
    await expect(page).toHaveURL(/\/climatizadores\/climadiff\/climatizador-wine-room-25$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wine Room 25");
    await expect(page.getByText("Volume máximo da divisão")).toBeVisible();
    // Reservations are for wine cellars only.
    await expect(page.getByRole("link", { name: "Reservar" })).toHaveCount(0);

    await addToCart(page, "/climatizadores/climadiff/climatizador-wine-room-25");
    await page.goto("/carrinho");
    await expect(page.getByRole("link", { name: /Wine Room 25/ }).first()).toHaveAttribute("href", "/climatizadores/climadiff/climatizador-wine-room-25");
});

test("a product's page answers only under its own kind", async ({ request }) => {
    expect((await request.get("/caves/climadiff/climatizador-wine-room-25")).status()).toBe(404);
    expect((await request.get("/garrafeiras/climadiff/climatizador-wine-room-25")).status()).toBe(404);

    const wrongBrand = await request.get("/garrafeiras/climadiff/garrafeira-modular-36", { maxRedirects: 0 });
    expect(wrongBrand.status()).toBe(308);
    expect(wrongBrand.headers().location).toMatch(/^\/garrafeiras\/avintage\/garrafeira-modular-36\b/);
});

test("search finds products of every kind", async ({ page }) => {
    await page.goto("/pesquisa?q=garrafeira");
    await expect(page.getByRole("link", { name: /Garrafeira Modular 36/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Classic 24/ })).toHaveCount(0);
});

test("an admin creates an accessory with only the fields it needs and publishes it", async ({ page, request }) => {
    const suffix = Date.now().toString(36);
    const name = `Filtro E2E ${suffix}`;
    const slug = name.toLowerCase().replaceAll(" ", "-");
    const photo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4tO8/AAWAAsQ2gUZEAAAAAElFTkSuQmCC", "base64");

    await signIn(page, "admin", "/admin/produtos/novo");
    await page.getByRole("navigation", { name: "Tipo de produto" }).getByRole("link", { name: "Acessório" }).click();
    await expect(page).toHaveURL(/tipo=acessorio/);
    // No cellar specifications for an accessory.
    await expect(page.getByLabel("Zonas de temperatura")).toHaveCount(0);
    await expect(page.getByLabel("Capacidade (garrafas)")).toHaveCount(0);

    await page.getByLabel("Nome").fill(name);
    await page.getByLabel("Marca").selectOption({ label: "Avintage" });
    await page.getByLabel("SKU").fill(`E2E-ACC-${suffix}`);
    await page.getByLabel("Preço (€)").fill("19");
    await page.getByLabel("Unidades em armazém").fill("5");
    await page.getByLabel("Resumo").fill("Filtro de carvão para caves de vinho.");
    await page.getByLabel("Descrição", { exact: true }).fill("Filtro de carvão ativo que retém odores dentro da cave.");
    await page.getByRole("button", { name: "Criar produto" }).click();
    await page.waitForURL(/\/admin\/produtos\/(?!novo)[a-z0-9]+$/);

    await page.locator("#image").setInputFiles({ name: "filtro.png", mimeType: "image/png", buffer: photo });
    await page.getByRole("button", { name: "Adicionar fotografia" }).click();
    await expect(page.getByRole("status")).toContainText("Fotografia adicionada");
    await page.getByLabel("Visível na loja").check();
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Produto atualizado");

    expect((await request.get(`/acessorios/avintage/${slug}`)).status()).toBe(200);
    expect(await (await request.get("/acessorios")).text()).toContain(name);

    // Leave the shared catalogue as it was.
    await page.getByLabel("Visível na loja").uncheck();
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Produto atualizado");
});

test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("the listings show their products", async ({ page }) => {
        for (const [path, product] of [
            ["/climatizadores", "Wine Room 25"],
            ["/garrafeiras", "Garrafeira Modular 36"],
            ["/acessorios", "Prateleira Deslizante em Faia"],
        ]) {
            await page.goto(path);
            await expect(page.getByRole("link", { name: new RegExp(product) }).first()).toBeVisible();
        }
    });
});
