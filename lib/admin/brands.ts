import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import type { BrandInput } from "@/lib/admin/brand-schema";
import { db } from "@/lib/db";

export async function listAdminBrands() {
    return db.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true, country: true, _count: { select: { products: true } } },
    });
}

export async function getAdminBrand(id: string) {
    if (!/^[a-z0-9-]{1,64}$/i.test(id)) return null;

    return db.brand.findUnique({
        where: { id },
        select: { id: true, slug: true, name: true, country: true, description: true },
    });
}

/** Unique-constraint violation → the field that clashed ("slug", "name", …). */
export function uniqueViolationField(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        return null;
    }

    const target = JSON.stringify(error.meta ?? {});
    return ["slug", "name", "sku", "ean"].find((field) => target.includes(field)) ?? "_form";
}

export async function createBrand(admin: Admin, input: BrandInput) {
    return db.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: input, select: { id: true } });
        await recordAudit(tx, admin, { action: "brand.create", entityType: "brand", entityId: brand.id, data: { slug: input.slug } });
        return brand;
    });
}

/** The slug is fixed after creation: changing it would break published URLs. */
export async function updateBrand(admin: Admin, id: string, input: Omit<BrandInput, "slug">) {
    return db.$transaction(async (tx) => {
        const { count } = await tx.brand.updateMany({
            where: { id },
            data: { name: input.name, country: input.country, description: input.description },
        });

        if (count === 0) return false;

        await recordAudit(tx, admin, { action: "brand.update", entityType: "brand", entityId: id });
        return true;
    });
}
