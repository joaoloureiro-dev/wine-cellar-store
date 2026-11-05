import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isReference } from "@/lib/references";

const ACCESS_SECONDS = 30 * 24 * 60 * 60;
const cookieName = (reference: string) => `order-access-${reference}`;

function signature(reference: string, expiresAt: string) {
    return createHmac("sha256", env.BETTER_AUTH_SECRET)
        .update(`guest-order:v1:${reference}:${expiresAt}`)
        .digest("base64url");
}

function createToken(reference: string) {
    const expiresAt = String(Math.floor(Date.now() / 1000) + ACCESS_SECONDS);
    return `${expiresAt}.${signature(reference, expiresAt)}`;
}

export function guestOrderAccessPath(reference: string) {
    return `/api/orders/${reference}/access?token=${createToken(reference)}`;
}

export function isGuestOrderToken(reference: string, token: string) {
    if (!isReference(reference, "ENC") || !/^\d{10}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;

    const [expiresAt, mac] = token.split(".");
    return Number(expiresAt) > Math.floor(Date.now() / 1000) &&
        timingSafeEqual(Buffer.from(mac), Buffer.from(signature(reference, expiresAt)));
}

export async function setGuestOrderCookie(reference: string, token = createToken(reference)) {
    (await cookies()).set(cookieName(reference), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.APP_URL.startsWith("https:"),
        path: "/",
        maxAge: Number(token.split(".")[0]) - Math.floor(Date.now() / 1000),
    });
}

export async function canAccessOrder(reference: string) {
    if (!isReference(reference, "ENC")) return false;

    const order = await db.order.findUnique({ where: { reference }, select: { userId: true } });
    if (!order) return false;
    if (order.userId) return (await getSession())?.user.id === order.userId;

    const token = (await cookies()).get(cookieName(reference))?.value;
    return Boolean(token && isGuestOrderToken(reference, token));
}

export async function grantCheckoutOrderAccess(reference: string, idempotencyKey: string, userId?: string) {
    const order = await db.order.findUnique({
        where: { reference },
        select: { idempotencyKey: true, userId: true },
    });
    if (!order || order.idempotencyKey !== idempotencyKey || order.userId !== (userId ?? null)) return false;
    if (!userId) await setGuestOrderCookie(reference);
    return true;
}
