import { expect, test } from "@playwright/test";

test("health endpoints report liveness and readiness without caching", async ({ request }) => {
    const live = await request.get("/api/health");
    expect(live.status()).toBe(200);

    const ready = await request.get("/api/health/ready");
    expect(ready.status()).toBe(200);
    expect(ready.headers()["cache-control"]).toContain("no-store");
    expect((await ready.json()).checks.database).toBe("ok");
});

test("responses carry the security headers", async ({ request }) => {
    const headers = (await request.get("/")).headers();

    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
});
