import { NextResponse } from "next/server";

import { productIdPattern } from "@/lib/favorites/constants";
import { getProductsByIds } from "@/lib/products";

/** Public catalogue data for a list of product ids (e.g. guest favourites). */
export async function GET(request: Request) {
    const ids = (new URL(request.url).searchParams.get("ids") ?? "")
        .split(",")
        .filter((id) => productIdPattern.test(id))
        .slice(0, 100);

    const products = await getProductsByIds(ids);
    const order = new Map(ids.map((id, index) => [id, index]));

    return NextResponse.json(
        { products: products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)) },
        { headers: { "Cache-Control": "public, max-age=60" } },
    );
}
