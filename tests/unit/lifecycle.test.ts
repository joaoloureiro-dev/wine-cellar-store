import { describe, expect, it } from "vitest";

import { canTransitionOrder, orderStatuses, releasesStock } from "@/lib/orders/status";
import { canTransition, isTerminalStatus, reservationStatuses } from "@/lib/reservations/status";

describe("order lifecycle", () => {
    it("follows the documented happy path", () => {
        expect(canTransitionOrder("AWAITING_PAYMENT", "PAID")).toBe(true);
        expect(canTransitionOrder("PAID", "PROCESSING")).toBe(true);
        expect(canTransitionOrder("PROCESSING", "SHIPPED")).toBe(true);
        expect(canTransitionOrder("SHIPPED", "DELIVERED")).toBe(true);
    });

    it("never skips payment or reopens a closed order", () => {
        expect(canTransitionOrder("AWAITING_PAYMENT", "SHIPPED")).toBe(false);
        expect(canTransitionOrder("SHIPPED", "CANCELLED")).toBe(false);

        for (const closed of ["DELIVERED", "CANCELLED", "EXPIRED"] as const) {
            for (const to of orderStatuses) {
                expect(canTransitionOrder(closed, to)).toBe(false);
            }
        }
    });

    it("releases stock only when an order is cancelled or expires", () => {
        expect(orderStatuses.filter(releasesStock)).toEqual(["CANCELLED", "EXPIRED"]);
    });
});

describe("reservation lifecycle", () => {
    it("allows confirm → request payment → paid", () => {
        expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
        expect(canTransition("CONFIRMED", "AWAITING_PAYMENT")).toBe(true);
        expect(canTransition("AWAITING_PAYMENT", "PAID")).toBe(true);
        expect(canTransition("PENDING", "PAID")).toBe(false);
    });

    it("treats paid, cancelled and expired as terminal", () => {
        expect(reservationStatuses.filter(isTerminalStatus)).toEqual(["PAID", "CANCELLED", "EXPIRED"]);
    });
});
