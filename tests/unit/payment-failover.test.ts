import { describe, expect, it } from "vitest";

import { isSafeToFailOver } from "@/lib/payments/failover";
import { PaymentProviderError } from "@/lib/payments/providers/types";
import { CircuitOpenError, TimeoutError } from "@/lib/resilience";

const connectError = (code: string) => Object.assign(new TypeError("fetch failed"), { cause: { code } });

describe("isSafeToFailOver", () => {
    it.each(["MBWAY", "MULTIBANCO"] as const)("fails over %s when nothing reached the provider", (method) => {
        expect(isSafeToFailOver(method, new CircuitOpenError("ifthenpay"))).toBe(true);
        expect(isSafeToFailOver(method, new PaymentProviderError("ifthenpay", "not configured", undefined, "config"))).toBe(true);
        expect(isSafeToFailOver(method, connectError("ECONNREFUSED"))).toBe(true);
        expect(isSafeToFailOver(method, connectError("ENOTFOUND"))).toBe(true);
    });

    it.each(["MBWAY", "MULTIBANCO"] as const)("never fails over %s after a rejection", (method) => {
        expect(isSafeToFailOver(method, new PaymentProviderError("eupago", "rejected", {}, "rejected"))).toBe(false);
    });

    it("does not risk a second MB WAY push after an ambiguous failure", () => {
        expect(isSafeToFailOver("MBWAY", new TimeoutError())).toBe(false);
        expect(isSafeToFailOver("MBWAY", new PaymentProviderError("ifthenpay", "HTTP 503", { status: 503 }))).toBe(false);
        expect(isSafeToFailOver("MBWAY", connectError("ECONNRESET"))).toBe(false);
    });

    it("fails over Multibanco after ambiguous failures (an unseen reference cannot be paid)", () => {
        expect(isSafeToFailOver("MULTIBANCO", new TimeoutError())).toBe(true);
        expect(isSafeToFailOver("MULTIBANCO", new PaymentProviderError("ifthenpay", "HTTP 500", { status: 500 }))).toBe(true);
    });
});
