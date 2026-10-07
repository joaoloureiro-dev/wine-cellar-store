import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth/server";

/** Current session (or null), read once per request. */
export const getSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

/**
 * Only same-site relative paths are allowed as post-login destinations,
 * preventing open redirects such as ?next=https://evil.example.
 */
export function safeNextPath(value: unknown, fallback = "/conta") {
    return typeof value === "string" && /^\/(?!\/)[^\s\\]*$/.test(value) ? value : fallback;
}

/** Returns the signed-in user or redirects to the sign-in page. */
export async function requireUser(nextPath: string) {
    const session = await getSession();

    if (!session) {
        redirect(`/entrar?next=${encodeURIComponent(safeNextPath(nextPath))}`);
    }

    return session.user;
}
