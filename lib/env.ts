import "server-only";

import { z } from "zod";

/**
 * Server-side environment, validated once at startup. Secrets are only
 * readable on the server (`server-only`) and never use a NEXT_PUBLIC_ prefix.
 *
 * Payment variables are optional: a payment method whose provider is not
 * configured is simply not offered at checkout.
 */
const optionalString = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);

const serverEnvSchema = z.object({
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** Public base URL, used for payment redirects and provider callbacks. */
    APP_URL: z.url().default("http://localhost:3000"),

    /** Provider for MB WAY and Multibanco. */
    PAYMENT_PROVIDER: z.enum(["ifthenpay", "eupago"]).default("ifthenpay"),
    /** Optional second provider used when the first one is unavailable. */
    PAYMENT_FALLBACK_PROVIDER: z.enum(["ifthenpay", "eupago"]).optional().catch(undefined),

    IFTHENPAY_API_URL: z.url().default("https://api.ifthenpay.com"),
    IFTHENPAY_MBWAY_KEY: optionalString,
    IFTHENPAY_MULTIBANCO_KEY: optionalString,
    IFTHENPAY_ANTI_PHISHING_KEY: optionalString,

    EUPAGO_API_URL: z.url().default("https://sandbox.eupago.pt"),
    EUPAGO_API_KEY: optionalString,
    EUPAGO_WEBHOOK_SECRET: optionalString,

    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    /** Only for local testing against a mock server (e.g. http://localhost:12111). */
    STRIPE_API_BASE_URL: z.url().optional(),

    BANK_TRANSFER_IBAN: optionalString,
    BANK_TRANSFER_BIC: optionalString,
    BANK_TRANSFER_HOLDER: optionalString,
    BANK_TRANSFER_BANK: optionalString,

    /** Signs auth cookies and tokens. Generate with: openssl rand -base64 32 */
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    /** Optional: enables "Continuar com Google". */
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,

    /** Shared secret for scheduled jobs (Authorization: Bearer <secret>). */
    CRON_SECRET: optionalString,

    /**
     * Optional Redis (e.g. redis://localhost:6379). Shares the 'use cache'
     * store, tag invalidations and auth rate limits between instances.
     */
    REDIS_URL: optionalString.refine((value) => !value || /^rediss?:\/\//.test(value), "REDIS_URL must start with redis:// or rediss://"),
    /** Key namespace when several apps share one Redis. */
    REDIS_KEY_PREFIX: optionalString,

    /**
     * Client IP for auth rate limits (see README, "Client IP behind a proxy").
     * TRUSTED_IP_HEADER: a header only your proxy sets (x-real-ip,
     * cf-connecting-ip, …). TRUSTED_PROXIES: comma-separated proxy IPs or
     * CIDRs, so X-Forwarded-For chains are read from the right.
     */
    TRUSTED_IP_HEADER: optionalString.refine(
        (value) => !value || /^[a-z0-9-]{1,64}$/i.test(value),
        "TRUSTED_IP_HEADER must be a header name, e.g. x-real-ip",
    ),
    TRUSTED_PROXIES: optionalString.transform((value) =>
        value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : undefined,
    ),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error(
        `Invalid server environment: ${parsed.error.issues
            .map((issue) => issue.path.join("."))
            .join(", ")}. See .env.example.`,
    );
}

export const env = parsed.data;
