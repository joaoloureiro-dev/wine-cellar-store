import { connection, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { imageTypes } from "@/lib/media/image-type";
import { MEDIA_KEY_PATTERN, mediaCacheControl, readLocalMedia } from "@/lib/media/storage";

const contentTypes: Record<string, string> = Object.fromEntries(Object.values(imageTypes).map((type) => [type.extension, type.contentType]));

/** Serves uploaded photos with MEDIA_STORAGE=local (development). */
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
    await connection();
    const key = (await params).key.join("/");

    if (env.MEDIA_STORAGE !== "local" || !MEDIA_KEY_PATTERN.test(key)) {
        return new NextResponse(null, { status: 404 });
    }

    try {
        const body = await readLocalMedia(key);

        return new NextResponse(new Uint8Array(body), {
            headers: { "Content-Type": contentTypes[key.split(".").pop()!.toLowerCase()], "Cache-Control": mediaCacheControl },
        });
    } catch {
        return new NextResponse(null, { status: 404 });
    }
}
