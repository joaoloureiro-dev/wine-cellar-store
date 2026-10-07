import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getFavoriteProductIds } from "@/lib/favorites/service";

/** Who is browsing and their saved favourites (empty for guests). */
export async function GET() {
    const session = await getSession();

    return NextResponse.json(
        {
            signedIn: Boolean(session),
            productIds: session ? await getFavoriteProductIds(session.user.id) : [],
        },
        { headers: { "Cache-Control": "private, no-store" } },
    );
}
