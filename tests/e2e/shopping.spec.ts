import { expect, test } from "@playwright/test";

import { addToCart, completeCheckout } from "./helpers";

test("browse the catalogue, buy by bank transfer and see payment instructions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Caves de Vinho" }).first().click();
    await expect(page).toHaveURL(/\/caves$/);
    await expect(page.getByRole("heading", { level: 1, name: "Caves de Vinho" })).toBeVisible();

    await addToCart(page, "/caves/la-sommeliere/classic-24");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Classic 24");

    await page.goto("/carrinho");
    await page.getByRole("link", { name: "Finalizar compra" }).first().click();
    await expect(page).toHaveURL(/\/checkout$/);

    const reference = await completeCheckout(page);

    await expect(page.getByText(reference).first()).toBeVisible();
    await expect(page.getByText("IBAN").first()).toBeVisible();
});

test("validates the checkout before moving on", async ({ page }) => {
    await addToCart(page, "/caves/avintage/dual-zone-45");
    await page.goto("/checkout");

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.locator("#name-error")).toBeVisible();

    await page.locator("#name").fill("Rita Silva");
    await page.locator("#email").fill("rita@e2e.test");
    await page.locator("#phone").fill("912 345 678");
    await page.locator("#taxId").fill("123456780");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.locator("#taxId-error")).toContainText("NIF");
});

test("filters in the URL narrow the catalogue and are not indexed", async ({ page }) => {
    await page.goto("/caves?marca=climadiff");
    await expect(page.getByText("Collection 109").first()).toBeVisible();
    await expect(page.getByText("Classic 24")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
