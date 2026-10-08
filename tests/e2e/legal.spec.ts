import { expect, test } from "@playwright/test";

const legalPages = ["/termos", "/devolucoes", "/privacidade", "/cookies"];

test("every page links to the legal pages and the complaints book", async ({ page }) => {
    for (const path of ["/", "/caves", "/carrinho"]) {
        await page.goto(path);
        const nav = page.getByRole("navigation", { name: "Informação legal" });

        for (const href of legalPages) {
            await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(1);
        }
        await expect(nav.getByRole("link", { name: "Livro de Reclamações" })).toHaveAttribute("href", "https://www.livroreclamacoes.pt");
    }
});

for (const path of legalPages) {
    test(`${path} is published with a heading and last update`, async ({ page }) => {
        const response = await page.goto(path);

        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByText(/Última atualização/)).toBeVisible();
    });
}

test("the reservation consent links to the privacy policy", async ({ request }) => {
    const html = await (await request.get("/caves/la-sommeliere/classic-24/reservar")).text();

    expect(html).toContain('href="/privacidade"');
});
