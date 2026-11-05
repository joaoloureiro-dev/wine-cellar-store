import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { isGuestOrderToken, setGuestOrderCookie } from "@/lib/orders/access";

const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function GET(request: Request, { params }: RouteContext<"/api/orders/[reference]/access">) {
    const { reference } = await params;
    const token = new URL(request.url).searchParams.get("token");

    if (!token || !isGuestOrderToken(reference, token)) {
        return NextResponse.json({ error: "Not found" }, { status: 404, headers });
    }

    await setGuestOrderCookie(reference, token);
    return NextResponse.redirect(new URL(`/encomendas/${reference}`, env.APP_URL), { headers });
}
