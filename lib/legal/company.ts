import "server-only";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

/** Date shown as "última atualização" on the legal pages. Update with every change to their text. */
export const LEGAL_LAST_UPDATED = "2026-10-08";

export type CompanyField = "name" | "taxId" | "address" | "registry" | "email" | "phone";

export const companyFieldLabels: Record<CompanyField, string> = {
    name: "denominação social",
    taxId: "NIPC",
    address: "morada da sede",
    registry: "conservatória e capital social",
    email: "email de contacto",
    phone: "telefone",
};

/** Seller details from LEGAL_* variables; null where not configured yet. */
export function getCompany(): Record<CompanyField, string | null> {
    return {
        name: env.LEGAL_COMPANY_NAME ?? null,
        taxId: env.LEGAL_TAX_ID ?? null,
        address: env.LEGAL_ADDRESS ?? null,
        registry: env.LEGAL_REGISTRY ?? null,
        email: env.LEGAL_EMAIL ?? null,
        phone: env.LEGAL_PHONE ?? null,
    };
}

const missing = (Object.keys(companyFieldLabels) as CompanyField[]).filter((field) => !getCompany()[field]);

if (missing.length > 0 && env.NODE_ENV === "production") {
    createLogger("legal").warn("Legal pages show placeholders: set the LEGAL_* variables", { missing });
}
