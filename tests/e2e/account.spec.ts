import { expect, test } from "@playwright/test";

import { signIn, signUp, uniqueEmail } from "./helpers";

test("private areas redirect guests before rendering", async ({ request }) => {
    const response = await request.get("/conta", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/entrar?next=%2Fconta");
});

test("sign up, manage an address and sign out", async ({ page }) => {
    await signUp(page, { name: "Joana Teste", email: uniqueEmail("joana") });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá, Joana Teste");

    await page.goto("/conta/moradas");
    await page.locator("#new-recipientName").fill("Joana Teste");
    await page.locator("#new-phone").fill("912 345 678");
    await page.locator("#new-addressLine1").fill("Rua do Ouro 100");
    await page.locator("#new-postalCode").fill("1100-148");
    await page.locator("#new-city").fill("Lisboa");
    await page.getByRole("button", { name: "Guardar morada" }).click();
    await expect(page.getByRole("status")).toContainText("Morada guardada");
    await expect(page.locator("main article")).toContainText("Rua do Ouro 100");

    await page.goto("/conta");
    await page.getByRole("button", { name: "Terminar sessão" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/conta");
    await expect(page).toHaveURL(/\/entrar\?next=%2Fconta$/);
});

test("customers cannot open the backoffice", async ({ page }) => {
    await signIn(page, "customer");

    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
});
