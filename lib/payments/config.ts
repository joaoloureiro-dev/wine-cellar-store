import "server-only";

import type { AnyPaymentMethod } from "@/lib/checkout/payment-methods";
import { env } from "@/lib/env";
import { eupago } from "@/lib/payments/providers/eupago";
import { ifthenpay } from "@/lib/payments/providers/ifthenpay";
import { isKlarnaConfigured, KLARNA_MAX_TOTAL_CENTS } from "@/lib/payments/providers/klarna";
import type { LocalPaymentProvider } from "@/lib/payments/providers/types";

/** Provider used for MB WAY and Multibanco (PAYMENT_PROVIDER). */
export function getLocalProvider(): LocalPaymentProvider {
    return env.PAYMENT_PROVIDER === "eupago" ? eupago : ifthenpay;
}

export type BankTransferDetails = {
    iban: string;
    bic?: string;
    holder: string;
    bank?: string;
};

export function getBankTransferDetails(): BankTransferDetails | null {
    if (!env.BANK_TRANSFER_IBAN || !env.BANK_TRANSFER_HOLDER) {
        return null;
    }

    return {
        iban: env.BANK_TRANSFER_IBAN.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim(),
        bic: env.BANK_TRANSFER_BIC,
        holder: env.BANK_TRANSFER_HOLDER,
        bank: env.BANK_TRANSFER_BANK,
    };
}

/**
 * Methods that can be offered for an order of `totalCents`: a method is
 * hidden when its provider is not configured or the amount is out of range.
 */
export function getAvailablePaymentMethods(totalCents: number): AnyPaymentMethod[] {
    const local = getLocalProvider();
    const methods: AnyPaymentMethod[] = [];

    if (local.isConfigured("MBWAY")) {
        methods.push("MBWAY");
    }

    if (local.isConfigured("MULTIBANCO")) {
        methods.push("MULTIBANCO");
    }

    if (getBankTransferDetails()) {
        methods.push("BANK_TRANSFER");
    }

    if (isKlarnaConfigured() && totalCents <= KLARNA_MAX_TOTAL_CENTS) {
        methods.push("KLARNA");
    }

    return methods;
}
