import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { getSession, safeNextPath } from "@/lib/auth/session";
import { db } from "@/lib/db";

export type Admin = { id: string; name: string; email: string };

/**
 * The signed-in user when they are an admin, otherwise null.
 *
 * The role is read from the database on every request (not from the session
 * cookie), so revoking access takes effect immediately.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
    const session = await getSession();

    if (!session) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, role: true },
    });

    return user?.role === "ADMIN" ? { id: user.id, name: user.name, email: user.email } : null;
});

/**
 * Guards backoffice pages: guests go to sign-in, signed-in customers get a
 * 404 so the backoffice is not advertised.
 */
export async function requireAdmin(nextPath: string): Promise<Admin> {
    const session = await getSession();

    if (!session) {
        redirect(`/entrar?next=${encodeURIComponent(safeNextPath(nextPath))}`);
    }

    const admin = await getAdmin();

    if (!admin) {
        notFound();
    }

    return admin;
}
