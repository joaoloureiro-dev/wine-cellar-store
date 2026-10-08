import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { anonymiseBeforeDeletion, getDeletionBlocker } from "@/lib/account/deletion";
import { createRateLimitStorage } from "@/lib/auth/rate-limit-storage";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { sanitizeText } from "@/lib/validation/fields";

const logger = createLogger("auth");

export const PASSWORD_MIN_LENGTH = 10;

/** Session cookie: `cellarium.session_token`. */
export const AUTH_COOKIE_PREFIX = "cellarium";

/**
 * Which request header identifies the client for rate limiting. Behind a
 * proxy this must be a header the proxy controls; otherwise clients could
 * spoof it, or every client would share one bucket (one attacker could
 * then lock everybody out of signing in).
 */
function clientIpOptions() {
    if (!env.TRUSTED_IP_HEADER && !env.TRUSTED_PROXIES && env.NODE_ENV === "production") {
        console.warn(
            JSON.stringify({
                level: "warn",
                scope: "auth",
                message: "Set TRUSTED_IP_HEADER or TRUSTED_PROXIES so rate limits use the real client IP",
            }),
        );
    }

    return {
        ...(env.TRUSTED_IP_HEADER ? { ipAddressHeaders: [env.TRUSTED_IP_HEADER.toLowerCase()] } : {}),
        ...(env.TRUSTED_PROXIES ? { trustedProxies: env.TRUSTED_PROXIES } : {}),
    };
}

/**
 * Better Auth configuration.
 *
 * Security notes:
 * - Passwords are hashed with scrypt; sessions are stored in PostgreSQL and
 *   can be revoked. Cookies are httpOnly, SameSite=Lax and Secure on HTTPS.
 * - Rate limiting and the origin (CSRF) check run on every HTTP request to
 *   /api/auth/*. Counters live in Redis when REDIS_URL is set (atomic,
 *   shared by all instances), otherwise in PostgreSQL. Sign-in, sign-up and password changes therefore always go
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
        customStorage: createRateLimitStorage(),
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 3 },
            "/change-password": { window: 60, max: 5 },
            "/delete-user": { window: 60, max: 5 },
        },
    },
    user: {
        // Account deletion (RGPD art. 17), from /conta/perfil.
        deleteUser: {
            enabled: true,
            beforeDelete: async (user) => {
                const blocker = await getDeletionBlocker(user.id);

                if (blocker) {
                    throw new APIError("BAD_REQUEST", { code: blocker, message: "Account cannot be deleted yet" });
                }

                await anonymiseBeforeDeletion(user.id);
            },
            afterDelete: async (user) => {
                logger.info("Account deleted", { userId: user.id });
            },
        },
    },
    hooks: {
        // Better Auth accepts a recent session instead of the password; for
        // accounts that have a password, always ask for it.
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/delete-user" || ctx.body?.password) return;

            const session = await getSessionFromCtx(ctx);
            const hasPassword = session ? await db.account.count({ where: { userId: session.user.id, providerId: "credential" } }) : 0;

            if (hasPassword > 0) {
                throw new APIError("BAD_REQUEST", { code: "PASSWORD_REQUIRED", message: "Password required" });
            }
        }),
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
        ipAddress: clientIpOptions(),
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
});

export function isGoogleSignInEnabled() {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
