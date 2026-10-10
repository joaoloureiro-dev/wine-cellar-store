import { expect, type BrowserContext, type Page } from "@playwright/test";

import { E2E_PASSWORD, e2eUsers } from "./users";

export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`;

export async function signUp(page: Page, { name, email }: { name: string; email: string }, next = "/conta") {
    await page.goto(`/registar?next=${encodeURIComponent(next)}`);
    await page.getByLabel("Nome").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill("garrafeira-2026");
    await page.locator("#confirmPassword").fill("garrafeira-2026");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(new RegExp(`${next}$`));
}

type Cookies = Awaited<ReturnType<BrowserContext["cookies"]>>;

/**
 * Session cookies per account, reused by later tests in the same worker:
 * signing in for every test would trip the sign-in rate limit (5 a minute
 * per IP), and no test signs these accounts out.
 */
const sessions = new Map<keyof typeof e2eUsers, Cookies>();

/** Signs in with one of the accounts created in global-setup.ts. */
export async function signIn(page: Page, who: keyof typeof e2eUsers, next = "/conta") {
    const cookies = sessions.get(who);

    if (cookies) {
        await page.context().addCookies(cookies);
        await page.goto(next);
        if (new URL(page.url()).pathname === next) return;
    }

    await page.goto(`/entrar?next=${encodeURIComponent(next)}`);
    await page.getByLabel("Email").fill(e2eUsers[who].email);
    await page.locator("#password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL((url) => url.pathname === next);
    sessions.set(who, await page.context().cookies());
}

/** Adds a product from its page and waits for the server to confirm. */
export async function addToCart(page: Page, productPath: string) {
    await page.goto(productPath);
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("status")).toContainText("adicionado ao carrinho");
}

/** Fills the five checkout steps and places the order. */
export async function completeCheckout(page: Page, payment = "BANK_TRANSFER") {
    const next = () => page.getByRole("button", { name: "Continuar" }).click();

    await page.locator("#name").fill("Rita Silva");
    await page.locator("#email").fill("rita@e2e.test");
    await page.locator("#phone").fill("912 345 678");
    await next();
    await page.locator("#addressLine1").fill("Rua das Flores 10");
    await page.locator("#postalCode").fill("1000-001");
    await page.locator("#city").fill("Lisboa");
    await next();
    await next();
    await page.locator(`input[value="${payment}"]`).check();
    await next();
    await page.locator('input[name="termsAccepted"]').check();
    await page.getByRole("button", { name: "Confirmar encomenda" }).click();
    await expect(page).toHaveURL(/\/encomendas\/ENC-[A-Z0-9]{8}$/);

    return new URL(page.url()).pathname.split("/").pop()!;
}
