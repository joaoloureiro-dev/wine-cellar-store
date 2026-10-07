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
