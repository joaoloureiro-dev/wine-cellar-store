import "server-only";

import { z } from "zod";

/**
 * Server-side environment, validated once at startup. Secrets are only
 * readable on the server (`server-only`) and never use a NEXT_PUBLIC_ prefix.
 */
const serverEnvSchema = z.object({
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
