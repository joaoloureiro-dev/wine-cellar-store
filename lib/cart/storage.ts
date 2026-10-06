import "server-only";

import { cookies } from "next/headers";

import {
    CART_COOKIE,
    CART_COUNT_COOKIE,
    CART_MAX_AGE_SECONDS,
    MAX_CART_LINES,
    MAX_QUANTITY_PER_ITEM,
} from "@/lib/cart/constants";
import { cartLineSchema, type CartLine } from "@/lib/cart/schema";

/**
 * Cookie-backed cart storage.
 *
 * The cookie only holds product IDs and quantities; prices and stock are
 * always re-read on the server. When carts move to PostgreSQL/Redis, only
 * this module changes (the cookie will then hold an opaque cart ID).
 */

const cookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_MAX_AGE_SECONDS,
} as const;

export async function readCartLines(): Promise<CartLine[]> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(CART_COOKIE)?.value;

    if (!raw) {
        return [];
    }

    try {
        const data: unknown = JSON.parse(raw);

        if (!Array.isArray(data)) {
            return [];
        }

        // Validate line by line: a single tampered line is dropped without
        // discarding the rest of the cart.
        const lines = data.flatMap((item) => {
            const parsed = cartLineSchema.safeParse(item);

            return parsed.success ? [parsed.data] : [];
        });

        return mergeDuplicateLines(lines).slice(0, MAX_CART_LINES);
    } catch {
        // Malformed or tampered cookie: start with an empty cart.
        return [];
    }
}

export async function writeCartLines(lines: CartLine[]) {
    const cookieStore = await cookies();

    if (lines.length === 0) {
        cookieStore.delete(CART_COOKIE);
        cookieStore.delete(CART_COUNT_COOKIE);
        return;
    }

    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

    cookieStore.set(CART_COOKIE, JSON.stringify(lines), {
        ...cookieOptions,
        httpOnly: true,
    });

    cookieStore.set(CART_COUNT_COOKIE, String(itemCount), {
        ...cookieOptions,
        httpOnly: false,
    });
}

function mergeDuplicateLines(lines: CartLine[]) {
    const merged = new Map<string, CartLine>();

    for (const line of lines) {
        const existing = merged.get(line.productId);

        merged.set(line.productId, {
            productId: line.productId,
            quantity: Math.min(
                (existing?.quantity ?? 0) + line.quantity,
                MAX_QUANTITY_PER_ITEM,
            ),
        });
    }

    return [...merged.values()];
}
