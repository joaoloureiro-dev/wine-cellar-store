import "server-only";

import { Prisma } from "@/generated/prisma/client";

/** Unique-constraint violation → the field that clashed ("slug", "name", …). */
export function uniqueViolationField(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        return null;
    }

    // Driver adapters report the index ("Product_sku_key"); the classic
    // engine reports the columns (target: ["sku"]).
    const meta = error.meta as { target?: unknown; driverAdapterError?: { cause?: { constraint?: { index?: string; fields?: string[] } } } } | undefined;
    const constraint = meta?.driverAdapterError?.cause?.constraint;
    const fields = constraint?.fields ?? (Array.isArray(meta?.target) ? meta.target : []);
    const field = fields[0] ?? constraint?.index?.match(/^[A-Za-z]+_(\w+?)_key$/)?.[1];

    return typeof field === "string" ? field.replace(/"/g, "") : "_form";
}
