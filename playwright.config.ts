import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

/**
 * End-to-end tests against a production build (`npm run build` first) and
 * a seeded database (`npm run db:seed`). The app is started with
 * bank-transfer details so the full checkout can be exercised without
 * payment providers.
 */
export default defineConfig({
    testDir: "tests/e2e",
    globalSetup: "./tests/e2e/global-setup.ts",
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: Boolean(process.env.CI),
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL,
        locale: "pt-PT",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
    ],
    webServer: {
        command: `npx next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: {
            APP_URL: baseURL,
            BANK_TRANSFER_IBAN: process.env.BANK_TRANSFER_IBAN ?? "PT50000201231234567890154",
            BANK_TRANSFER_HOLDER: process.env.BANK_TRANSFER_HOLDER ?? "Cellarium Teste, Lda.",
            BANK_TRANSFER_BANK: process.env.BANK_TRANSFER_BANK ?? "Banco de Teste",
        },
    },
});
