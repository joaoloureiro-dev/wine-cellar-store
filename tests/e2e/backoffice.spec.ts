import { expect, test } from "@playwright/test";

import { addToCart, completeCheckout, signIn } from "./helpers";

test("an admin confirms a bank transfer and moves the order to preparation", async ({ page, browser }) => {
    // Customer places an order in a separate session.
    const customer = await browser.newPage();
    await addToCart(customer, "/caves/climadiff/collection-109");
    await customer.goto("/checkout");
    const reference = await completeCheckout(customer);
    await customer.close();

    await signIn(page, "admin", "/admin");
    await page.goto(`/admin/encomendas?q=${reference}`);
    await page.getByRole("link", { name: new RegExp(reference) }).click();
    await page.getByRole("button", { name: "Confirmar transferência recebida" }).click();
    await expect(page.getByRole("status")).toContainText("Pagamento confirmado");

    await page.getByRole("button", { name: "Iniciar preparação" }).click();
    await expect(page.getByRole("status")).toContainText("Encomenda em preparação");
    await expect(page.locator('section[aria-label="Histórico"]')).toContainText("Em preparação");
});

test("a price change in the backoffice is visible on the product page immediately", async ({ page, request }) => {
    await signIn(page, "admin", "/admin");

    const setPrice = async (price: string) => {
        await page.goto("/admin/produtos?q=Dual");
        await page.getByRole("link", { name: /Dual Zone 45/ }).click();
        await page.locator("#price").fill(price);
        await page.getByRole("button", { name: "Guardar alterações" }).click();
        await expect(page.getByRole("status")).toContainText("Produto atualizado");
    };

    await setPrice("879,00");
    expect(await (await request.get("/caves/avintage/dual-zone-45")).text()).toContain("879,00");

    await setPrice("899,00");
    expect(await (await request.get("/caves/avintage/dual-zone-45")).text()).toContain("899,00");
});

test("an admin adds a product with a photo and publishes it", async ({ page, request }) => {
    const suffix = Date.now().toString(36);
    const name = `Cave Teste ${suffix}`;
    const slug = `cave-teste-${suffix}`;
    // 1×1 PNG: the type is checked by content, not by name.
    const photo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4tO8/AAWAAsQ2gUZEAAAAAElFTkSuQmCC", "base64");

    await signIn(page, "admin", "/admin/produtos/novo");
    await page.getByLabel("Nome").fill(name);
    await page.getByLabel("Marca").selectOption({ label: "Avintage" });
    await page.getByLabel("SKU").fill(`E2E-${suffix}`);
    await page.getByLabel("Preço (€)").fill("749");
    await page.getByLabel("Unidades em armazém").fill("3");
    await page.getByLabel("Resumo").fill("Cave de teste criada no backoffice.");
    await page.getByLabel("Descrição", { exact: true }).fill("Cave de vinho de teste criada pelo teste de ponta a ponta.");
    await page.getByLabel("Capacidade (garrafas)").fill("30");
    await page.locator("#zone1Min").fill("5");
    await page.locator("#zone1Max").fill("18");
    await page.getByLabel("Largura (cm)").fill("40");
    await page.getByLabel("Altura (cm)").fill("85");
    await page.getByLabel("Profundidade (cm)").fill("55");
    await page.getByRole("button", { name: "Criar produto" }).click();
    await page.waitForURL(/\/admin\/produtos\/(?!novo)[a-z0-9]+$/);

    // Not on the storefront while hidden.
    expect((await request.get(`/caves/avintage/${slug}`)).status()).toBe(404);

    await page.locator("#image").setInputFiles({ name: "cave.png", mimeType: "image/png", buffer: photo });
    await page.getByRole("button", { name: "Adicionar fotografia" }).click();
    await expect(page.getByRole("status")).toContainText("Fotografia adicionada");

    await page.getByLabel("Visível na loja").check();
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Produto atualizado");

    const productPage = await request.get(`/caves/avintage/${slug}`);
    expect(productPage.status()).toBe(200);
    expect(await productPage.text()).toContain(encodeURIComponent("/media/products/"));

    // Leave the shared catalogue as it was.
    await page.getByLabel("Visível na loja").uncheck();
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Produto atualizado");
});
