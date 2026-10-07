import { describe, expect, it, vi } from "vitest";

import { isTransientDbError, retryTransient } from "@/lib/db-retry";

const transient = Object.assign(new Error("Can't reach database server at db:5432"), { code: "P1001" });

describe("isTransientDbError", () => {
    it("recognises connection-level failures", () => {
        expect(isTransientDbError(transient)).toBe(true);
        expect(isTransientDbError(new Error("Connection terminated unexpectedly"))).toBe(true);
        expect(isTransientDbError(Object.assign(new Error("x"), { code: "P2024" }))).toBe(true);
    });

    it("never treats query errors as transient", () => {
        expect(isTransientDbError(Object.assign(new Error("Unique constraint failed"), { code: "P2002" }))).toBe(false);
        expect(isTransientDbError(new Error('new row violates check constraint "Product_stockQuantity_check"'))).toBe(false);
        expect(isTransientDbError("boom")).toBe(false);
    });
});

describe("retryTransient", () => {
    it("retries transient failures and returns the eventual result", async () => {
        const run = vi.fn().mockRejectedValueOnce(transient).mockRejectedValueOnce(transient).mockResolvedValue("ok");

        await expect(retryTransient(run, { delays: [0, 0, 0] })).resolves.toBe("ok");
        expect(run).toHaveBeenCalledTimes(3);
    });

    it("gives up after the last delay", async () => {
        const run = vi.fn().mockRejectedValue(transient);

        await expect(retryTransient(run, { delays: [0, 0] })).rejects.toBe(transient);
        expect(run).toHaveBeenCalledTimes(3);
    });

    it("does not retry other errors", async () => {
        const error = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        const run = vi.fn().mockRejectedValue(error);

        await expect(retryTransient(run, { delays: [0, 0] })).rejects.toBe(error);
        expect(run).toHaveBeenCalledTimes(1);
    });
});
