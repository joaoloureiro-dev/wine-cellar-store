import { readFile } from "node:fs/promises";

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

test("a customer downloads their data and deletes their account", async ({ page }) => {
    const email = uniqueEmail("apagar");
    await signUp(page, { name: "Duarte Lopes", email });
    await page.goto("/conta/perfil");

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Descarregar os meus dados/ }).click()]);
    const data = JSON.parse(await readFile((await download.path())!, "utf8"));
    expect(data.account).toMatchObject({ name: "Duarte Lopes", email });

    await page.getByRole("checkbox", { name: /Compreendo/ }).check();
    await page.getByRole("button", { name: "Eliminar conta" }).click();
    await expect(page.locator("#deletePassword-error")).toContainText("Indique a sua password");

    await page.locator("#deletePassword").fill("garrafeira-2026");
    await page.getByRole("button", { name: "Eliminar conta" }).click();
    await expect(page.getByRole("status")).toContainText("Conta eliminada");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/conta");
    await expect(page).toHaveURL(/\/entrar/);
});

test("password recovery never reveals whether an account exists", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByRole("link", { name: "Esqueceu-se da password?" }).click();
    await expect(page).toHaveURL(/\/recuperar-password$/);

    await page.getByLabel("Email").fill("ninguem@e2e.test");
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.locator("main [role=status]")).toContainText("Se existir uma conta com ninguem@e2e.test");
});

test("a reset link without a valid token explains what to do", async ({ page }) => {
    await page.goto("/nova-password");
    await expect(page.locator("main [role=alert]")).toContainText("já não é válido");

    await page.goto("/nova-password?token=abcdefghijklmnop");
    await page.locator("#newPassword").fill("garrafeira-nova-2027");
    await page.locator("#confirmPassword").fill("garrafeira-nova-2027");
    await page.getByRole("button", { name: "Guardar nova password" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("Peça um novo");
});
