import { createServer, type Server } from "node:http";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { checkoutInput, createProduct, resetDatabase } from "../support/db";

// lib/env is parsed on first import, so the fake providers' addresses must
// be in the environment before any application module loads.
const PRIMARY_PORT = 47_101;
const FALLBACK_PORT = 47_102;
vi.hoisted(() => {
    Object.assign(process.env, {
        PAYMENT_PROVIDER: "ifthenpay",
        PAYMENT_FALLBACK_PROVIDER: "eupago",
        IFTHENPAY_API_URL: "http://127.0.0.1:47101",
        IFTHENPAY_MBWAY_KEY: "ABC-123456",
        IFTHENPAY_MULTIBANCO_KEY: "ABC-654321",
        IFTHENPAY_ANTI_PHISHING_KEY: "anti-phishing-test",
        EUPAGO_API_URL: "http://127.0.0.1:47102",
        EUPAGO_API_KEY: "demo-key",
        EUPAGO_WEBHOOK_SECRET: "0123456789abcdef0123456789abcdef",
    });
});

/**
 * Two fake providers on localhost. Each test sets how ifthenpay (primary)
 * behaves; eupago (fallback) always succeeds.
 */
type Mode = "ok" | "http503" | "reject";
let primaryMode: Mode = "ok";
const calls: string[] = [];

let primary: Server;
let fallback: Server;
let service: typeof import("@/lib/payments/service");
let db: typeof import("@/lib/db").db;

function startServer(name: string, port: number, handler: (path: string) => { status: number; body: unknown }) {
    return new Promise<Server>((resolve) => {
        const server = createServer((request, response) => {
            request.resume();
            request.on("end", () => {
                calls.push(`${name} ${request.url}`);
                const { status, body } = handler(request.url ?? "");
                response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
            });
        });
        server.listen(port, "127.0.0.1", () => resolve(server));
    });
}

beforeAll(async () => {
    primary = await startServer("ifthenpay", PRIMARY_PORT, (path) => {
        if (primaryMode === "http503") return { status: 503, body: {} };
        if (path.startsWith("/spg/payment/mbway")) {
            return primaryMode === "reject"
                ? { status: 200, body: { Status: "122", Message: "Invalid number" } }
                : { status: 200, body: { Status: "000", RequestId: `ift-${Date.now()}` } };
        }
        return primaryMode === "reject"
            ? { status: 200, body: { Status: "-1" } }
            : { status: 200, body: { Status: "0", Entity: "11111", Reference: "123456789", RequestId: `ift-mb-${Date.now()}` } };
    });
    fallback = await startServer("eupago", FALLBACK_PORT, (path) =>
        path.includes("mbway")
            ? { status: 200, body: { transactionStatus: "Success", transactionID: Date.now(), reference: "eup" } }
            : { status: 200, body: { estado: 0, entidade: "22222", referencia: "987654321", valor: 1 } },
    );

    service = await import("@/lib/payments/service");
    ({ db } = await import("@/lib/db"));
});

afterAll(async () => {
    await new Promise((resolve) => primary.close(resolve));
    await new Promise((resolve) => fallback.close(resolve));
});

beforeEach(async () => {
    await resetDatabase();
    calls.length = 0;
    primaryMode = "ok";
});

async function newOrder(paymentMethod: "MBWAY" | "MULTIBANCO") {
    const { placeOrder } = await import("@/lib/orders/service");
    const product = await createProduct({ stock: 5 });
    return placeOrder(checkoutInput({ paymentMethod }), [{ productId: product.id, quantity: 1 }]);
}

async function attempts(reference: string) {
    return db.payment.findMany({
        where: { order: { reference } },
        orderBy: { createdAt: "asc" },
        select: { provider: true, status: true },
    });
}

describe("payment provider failover", () => {
    it("uses the primary provider when it is healthy", async () => {
        const { reference } = await newOrder("MBWAY");

        expect(await service.initiatePayment(reference)).toEqual({ ok: true });
        expect(await attempts(reference)).toEqual([{ provider: "IFTHENPAY", status: "PENDING" }]);
    });

    it("moves Multibanco to the fallback when the primary answers 503", async () => {
        primaryMode = "http503";
        const { reference } = await newOrder("MULTIBANCO");

        expect(await service.initiatePayment(reference)).toEqual({ ok: true });
        expect(await attempts(reference)).toEqual([
            { provider: "IFTHENPAY", status: "FAILED" },
            { provider: "EUPAGO", status: "PENDING" },
        ]);
        const pending = await db.payment.findFirstOrThrow({ where: { order: { reference }, status: "PENDING" } });
        expect(pending).toMatchObject({ mbEntity: "22222", mbReference: "987654321" });
    });

    it("does not fail over MB WAY after an ambiguous 503 (no risk of a second push)", async () => {
        primaryMode = "http503";
        const { reference } = await newOrder("MBWAY");

        const result = await service.initiatePayment(reference);

        expect(result.ok).toBe(false);
        expect(await attempts(reference)).toEqual([{ provider: "IFTHENPAY", status: "FAILED" }]);
        expect(calls.some((call) => call.startsWith("eupago"))).toBe(false);
    });

    it("fails MB WAY over when the primary cannot be reached at all", async () => {
        const { reference } = await newOrder("MBWAY");
        await new Promise((resolve) => primary.close(resolve));

        try {
            expect(await service.initiatePayment(reference)).toEqual({ ok: true });
            expect(await attempts(reference)).toEqual([
                { provider: "IFTHENPAY", status: "FAILED" },
                { provider: "EUPAGO", status: "PENDING" },
            ]);
        } finally {
            await new Promise<void>((resolve) => primary.listen(PRIMARY_PORT, "127.0.0.1", () => resolve()));
        }
    });

    it("never fails over after the provider rejects the request", async () => {
        primaryMode = "reject";
        const { reference } = await newOrder("MBWAY");

        expect((await service.initiatePayment(reference)).ok).toBe(false);
        expect(await attempts(reference)).toEqual([{ provider: "IFTHENPAY", status: "FAILED" }]);
    });
});
