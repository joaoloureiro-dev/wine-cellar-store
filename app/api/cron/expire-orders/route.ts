import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { expireOverdueOrders } from "@/lib/orders/expiry";
import { safeEqual } from "@/lib/payments/webhooks/verify";

/**
 * Scheduled job (e.g. Vercel Cron or any scheduler every 15 minutes):
 *   GET /api/cron/expire-orders   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
    if (!env.CRON_SECRET) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const authorization = request.headers.get("authorization") ?? "";

    if (!safeEqual(authorization, `Bearer ${env.CRON_SECRET}`)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await expireOverdueOrders();

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
