import { NextResponse } from "next/server";

import { getOrderPaymentView } from "@/lib/payments/service";
import { canAccessOrder } from "@/lib/orders/access";

/**
 * Lightweight status endpoint polled by the order page while a payment is
 * pending. Reads the database only (never trusts the browser) and returns
 * no personal data.
 */
export async function GET(
    _request: Request,
    { params }: RouteContext<"/api/orders/[reference]/payment-status">,
) {
    const { reference } = await params;

    if (!(await canAccessOrder(reference))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const view = await getOrderPaymentView(reference);

    if (!view) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
        { orderStatus: view.orderStatus, paymentStatus: view.payment?.status ?? null },
        { headers: { "Cache-Control": "no-store" } },
    );
}
