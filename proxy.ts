import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { AUTH_COOKIE_PREFIX, auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

/**
 * Access checks that need a real HTTP status. With Cache Components every
 * route streams a static shell first, so a redirect or 404 raised inside a
 * page arrives with status 200; here it happens before rendering.
 *
 * - /conta: optimistic check (session cookie present), no database call.
 * - /admin: full check (valid session + ADMIN role); others get a 404 so
 *   the backoffice is not advertised.
 * - /entrar, /registar: signed-in users go straight to `next`. Validated
 *   in full (not just the cookie), so a stale cookie can't cause a loop
 *   with /conta.
 *
 * Pages and server actions still verify access themselves: this is a
 * first line, not the only one.
 */
export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    const redirectToSignIn = () => {
        const url = new URL("/entrar", request.url);
        url.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(url);
    };

    const hasSessionCookie = Boolean(getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }));

    if (pathname === "/entrar" || pathname === "/registar") {
        if (hasSessionCookie && (await auth.api.getSession({ headers: request.headers }))) {
            const next = safeNextPath(request.nextUrl.searchParams.get("next"));
            return NextResponse.redirect(new URL(next, request.url));
        }

        return NextResponse.next();
    }

    if (!hasSessionCookie) {
        return redirectToSignIn();
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return redirectToSignIn();
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== "ADMIN") {
            // No such route: renders the not-found page with a 404 status.
            return NextResponse.rewrite(new URL("/_admin_not_found", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/conta/:path*", "/admin/:path*", "/entrar", "/registar"],
};
