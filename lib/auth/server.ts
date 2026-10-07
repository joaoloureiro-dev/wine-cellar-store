import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sanitizeText } from "@/lib/validation/fields";

export const PASSWORD_MIN_LENGTH = 10;

/** Session cookie: `cellarium.session_token`. */
export const AUTH_COOKIE_PREFIX = "cellarium";

/**
 * Better Auth configuration.
 *
 * Security notes:
 * - Passwords are hashed with scrypt; sessions are stored in PostgreSQL and
 *   can be revoked. Cookies are httpOnly, SameSite=Lax and Secure on HTTPS.
 * - Rate limiting and the origin (CSRF) check run on every HTTP request to
 *   /api/auth/*, with counters in the database so they hold across
 *   instances. Sign-in, sign-up and password changes therefore always go
 *   through that HTTP API (auth client), never through direct server calls.
 * - Email verification, password reset and magic links need email sending
 *   and are enabled in the emails stage.
 */
export const auth = betterAuth({
    appName: "Cellarium",
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: prismaAdapter(db, { provider: "postgresql" }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: PASSWORD_MIN_LENGTH,
        maxPasswordLength: 128,
        requireEmailVerification: false,
    },
    socialProviders:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: env.GOOGLE_CLIENT_ID,
                      clientSecret: env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {},
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
    },
    rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 3 },
            "/change-password": { window: 60, max: 5 },
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => ({
                    data: { ...user, name: sanitizeText(user.name).slice(0, 100) },
                }),
            },
        },
    },
    advanced: {
        cookiePrefix: AUTH_COOKIE_PREFIX,
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
});

export function isGoogleSignInEnabled() {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
