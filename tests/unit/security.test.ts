import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "@/lib/security/headers";

describe("content security policy", () => {
    it("locks down framing, plugins, base and form targets in production", () => {
        const csp = contentSecurityPolicy({ isDev: false });

        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("form-action 'self' https://checkout.stripe.com");
        expect(csp).toContain("upgrade-insecure-requests");
        expect(csp).not.toContain("unsafe-eval");
    });

    it("only relaxes eval and websockets for the dev server", () => {
        const csp = contentSecurityPolicy({ isDev: true });

        expect(csp).toContain("'unsafe-eval'");
        expect(csp).not.toContain("upgrade-insecure-requests");
    });

    it("sends the baseline hardening headers", () => {
        const keys = securityHeaders({ isDev: false }).map((header) => header.key);

        expect(keys).toEqual(
            expect.arrayContaining([
                "Content-Security-Policy",
                "Strict-Transport-Security",
                "X-Content-Type-Options",
                "X-Frame-Options",
                "Referrer-Policy",
                "Permissions-Policy",
            ]),
        );
    });
});
