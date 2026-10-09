import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("category pages list their cellars and filter the catalogue", async ({ page }) => {
    await page.goto("/categorias");
    await page.getByRole("link", { name: "Caves de serviço" }).click();
    await expect(page).toHaveURL(/\/categorias\/caves-de-servico$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Caves de serviço");
    await expect(page.getByRole("link", { name: /Dual Zone 45/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Collection 109/ })).toHaveCount(0);

    await page.goto("/caves?categoria=caves-de-envelhecimento");
    await expect(page.getByRole("link", { name: /Collection 109/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Dual Zone 45/ })).toHaveCount(0);
});

test("an admin creates a category, assigns a product and removes the category", async ({ page, request }) => {
    const name = `Caves teste ${Date.now().toString(36)}`;
    const slug = name.toLowerCase().replaceAll(" ", "-");

    await signIn(page, "admin", "/admin/categorias/nova");
    await page.getByLabel("Nome").fill(name);
    await page.getByLabel("Descrição", { exact: true }).fill("Categoria criada pelo teste de ponta a ponta.");
    await page.getByRole("button", { name: "Criar categoria" }).click();
    await expect(page.getByRole("status")).toContainText("Categoria criada");
    await page.waitForURL(/\/admin\/categorias\/(?!nova)[a-z0-9]+$/);
    const categoryUrl = page.url();

    // Assign Classic 24 to the new category.
    await page.goto("/admin/produtos?q=Classic");
    await page.getByRole("link", { name: /Classic 24/ }).click();
    await page.getByRole("checkbox", { name }).check();
    await page.getByRole("button", { name: "Guardar detalhes" }).click();
    await expect(page.getByRole("status")).toContainText("Detalhes guardados");

    expect(await (await request.get(`/categorias/${slug}`)).text()).toContain("Classic 24");

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(categoryUrl);
    await page.getByRole("button", { name: "Eliminar categoria" }).click();
    await page.waitForURL(/\/admin\/categorias$/);

    expect((await request.get(`/categorias/${slug}`)).status()).toBe(404);
    expect((await request.get("/caves/la-sommeliere/classic-24")).status()).toBe(200);
});
