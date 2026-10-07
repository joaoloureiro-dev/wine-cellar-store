import { connection, NextResponse } from "next/server";

/** Liveness: the process is up and serving. No dependencies checked. */
export async function GET() {
    await connection();

    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
