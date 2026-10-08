import { NextResponse } from "next/server";

import { buildAccountExport } from "@/lib/account/export";
import { getSession } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/seo/metadata";

/** Downloads the signed-in customer's data as JSON (link in /conta/perfil). */
export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.redirect(absoluteUrl(`/entrar?next=${encodeURIComponent("/conta/perfil")}`), 303);
    }

    const data = await buildAccountExport(session.user.id);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="cellarium-dados-${date}.json"`,
            "Cache-Control": "private, no-store",
        },
    });
}
