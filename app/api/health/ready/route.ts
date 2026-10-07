import { connection, NextResponse } from "next/server";

import { getReadiness } from "@/lib/health";

/** Readiness: 200 while the instance can serve (ok/degraded), 503 otherwise. */
export async function GET() {
    await connection();
    const readiness = await getReadiness();

    return NextResponse.json(readiness, {
        status: readiness.status === "down" ? 503 : 200,
        headers: { "Cache-Control": "no-store" },
    });
}
