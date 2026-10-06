/** Error raised by a provider adapter. Messages never contain personal data. */
export class PaymentProviderError extends Error {
    constructor(
        public readonly provider: string,
        message: string,
        public readonly details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = "PaymentProviderError";
    }
}

export type MbWayRequest = {
    orderReference: string;
    amountCents: number;
    /** Portuguese mobile number, 9 digits (e.g. 912345678). */
    phone: string;
    description: string;
};

export type MbWayResult = {
    providerReference: string;
    expiresAt: Date;
};

export type MultibancoRequest = {
    orderReference: string;
    amountCents: number;
    description: string;
    /** Days until the reference expires (provider permitting). */
    expiryDays: number;
};

export type MultibancoResult = {
    providerReference: string | null;
    entity: string;
    reference: string;
    expiresAt: Date | null;
};

/** Provider for Portuguese methods (MB WAY and Multibanco). */
export interface LocalPaymentProvider {
    readonly id: "IFTHENPAY" | "EUPAGO";
    isConfigured(method: "MBWAY" | "MULTIBANCO"): boolean;
    createMbWayPayment(request: MbWayRequest): Promise<MbWayResult>;
    createMultibancoReference(request: MultibancoRequest): Promise<MultibancoResult>;
}

export function centsToDecimalString(cents: number) {
    return (cents / 100).toFixed(2);
}

/** "+351 912 345 678" → "912345678". */
export function toPortugueseMobile(phone: string) {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("351") ? digits.slice(3) : digits;
}
