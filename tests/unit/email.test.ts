import { afterEach, describe, expect, it, vi } from "vitest";

import { renderEmail } from "@/lib/email/layout";

describe("renderEmail", () => {
    it("escapes every dynamic value and builds a plain-text version", () => {
        const email = renderEmail({
            subject: "Encomenda <ENC-1>",
            preheader: "Obrigado",
            heading: "Olá <script>alert(1)</script>",
            blocks: [
                { kind: "paragraph", text: 'Nota: "Tom & Jerry"' },
                { kind: "details", rows: [["Total", "1 299,00 €"]] },
                { kind: "button", label: "Ver encomenda", href: "https://cellarium.test/encomendas/ENC-1?a=1&b=2" },
            ],
        });

        expect(email.html).not.toContain("<script>");
        expect(email.html).toContain("Olá &lt;script&gt;");
        expect(email.html).toContain("&quot;Tom &amp; Jerry&quot;");
        expect(email.html).toContain('href="https://cellarium.test/encomendas/ENC-1?a=1&amp;b=2"');
        expect(email.text).toContain("Total: 1 299,00 €");
        expect(email.text).toContain("Ver encomenda: https://cellarium.test/encomendas/ENC-1?a=1&b=2");
    });
});

describe("Resend provider", () => {
    async function loadProvider(fetchMock: typeof fetch) {
        vi.resetModules();
        vi.stubEnv("EMAIL_PROVIDER", "resend");
        vi.stubEnv("RESEND_API_KEY", "re_test");
        vi.stubEnv("EMAIL_FROM", "Cellarium <encomendas@cellarium.test>");
        vi.stubGlobal("fetch", fetchMock);
        return import("@/lib/email/providers");
    }

    const email = { to: "rita@example.pt", subject: "Olá", html: "<p>Olá</p>", text: "Olá", idempotencyKey: "outbox-1" };

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("sends with the idempotency key", async () => {
        const fetchMock = vi.fn(async () => Response.json({ id: "re_123" }));
        const { getEmailProvider } = await loadProvider(fetchMock as unknown as typeof fetch);

        expect(await getEmailProvider().send(email)).toEqual({ id: "re_123" });

        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(url).toBe("https://api.resend.com/emails");
        expect(headers["Idempotency-Key"]).toBe("outbox-1");
        expect(headers.Authorization).toBe("Bearer re_test");
        expect(JSON.parse(init.body as string)).toMatchObject({ from: "Cellarium <encomendas@cellarium.test>", to: ["rita@example.pt"] });
    });

    it.each([
        [503, true],
        [429, true],
        [422, false],
        [401, false],
    ])("treats HTTP %i as retryable: %s", async (status, retryable) => {
        const { getEmailProvider, EmailProviderError } = await loadProvider(vi.fn(async () => new Response("error", { status })) as unknown as typeof fetch);

        const error = await getEmailProvider().send(email).catch((caught) => caught);
        expect(error).toBeInstanceOf(EmailProviderError);
        expect(error.retryable).toBe(retryable);
    });

    it("treats network errors as retryable", async () => {
        const { getEmailProvider } = await loadProvider(vi.fn(async () => {
            throw new TypeError("fetch failed");
        }) as unknown as typeof fetch);

        await expect(getEmailProvider().send(email)).rejects.toMatchObject({ retryable: true });
    });
});
