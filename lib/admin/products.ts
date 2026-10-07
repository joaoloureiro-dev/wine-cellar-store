import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/list-params";
import { deriveStockStatus, type ProductUpdateInput } from "@/lib/admin/product-schema";
import { db } from "@/lib/db";

export const stockStatusValues = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER"] as const;
export type StockStatusValue = (typeof stockStatusValues)[number];

export async function listAdminProducts({
    status,
    q,
    page,
}: {
    status?: StockStatusValue;
    q?: string;
    page: number;
}) {
    const where: Prisma.ProductWhereInput = {
        stockStatus: status,
        OR: q
            ? [
                  { name: { contains: q, mode: "insensitive" } },
                  { sku: { contains: q, mode: "insensitive" } },
                  { brand: { name: { contains: q, mode: "insensitive" } } },
              ]
            : undefined,
    };

    const [products, total] = await Promise.all([
        db.product.findMany({
            where,
            orderBy: [{ active: "desc" }, { name: "asc" }],
            skip: (page - 1) * ADMIN_PAGE_SIZE,
            take: ADMIN_PAGE_SIZE,
            select: {
                id: true,
                name: true,
                sku: true,
                priceCents: true,
                stockQuantity: true,
                stockStatus: true,
                active: true,
                featured: true,
                brand: { select: { name: true } },
            },
        }),
        db.product.count({ where }),
    ]);

    return { products, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminProduct(id: string) {
    if (!/^[a-z0-9-]{1,64}$/i.test(id)) {
        return null;
    }

    return db.product.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            priceCents: true,
            compareAtPriceCents: true,
            stockQuantity: true,
            stockStatus: true,
            active: true,
            featured: true,
            updatedAt: true,
            brand: { select: { name: true, slug: true } },
        },
    });
}

/** Units already taken out of stock by unpaid orders and held reservations. */
export async function getCommittedUnits(productId: string) {
    const [orders, reservations] = await Promise.all([
        db.orderItem.aggregate({
            where: { productId, order: { status: "AWAITING_PAYMENT" } },
            _sum: { quantity: true },
        }),
        db.reservation.aggregate({
            where: { productId, stockHeld: true, status: { in: ["CONFIRMED", "AWAITING_PAYMENT"] } },
            _sum: { quantity: true },
        }),
    ]);

    return { unpaidOrders: orders._sum.quantity ?? 0, heldReservations: reservations._sum.quantity ?? 0 };
}

export class ProductConflictError extends Error {
    constructor() {
        super("O produto foi alterado entretanto (por exemplo, uma venda). Reveja os valores atuais e guarde novamente.");
        this.name = "ProductConflictError";
    }
}

/**
 * Saves price, stock and visibility. Optimistic locking on `updatedAt`:
 * if anything changed the product since the form was loaded (an admin or
 * a sale holding stock), nothing is written and the admin reviews the
 * fresh values instead of silently overwriting the stock count.
 *
 * @returns false when the product does not exist.
 */
export async function updateProduct(admin: Admin, input: ProductUpdateInput) {
    return db.$transaction(async (tx) => {
        const before = await tx.product.findUnique({
            where: { id: input.productId },
            select: {
                priceCents: true,
                compareAtPriceCents: true,
                stockQuantity: true,
                stockStatus: true,
                active: true,
                featured: true,
            },
        });

        if (!before) {
            return false;
        }

        const after = {
            priceCents: input.price,
            compareAtPriceCents: input.compareAtPrice,
            stockQuantity: input.stockQuantity,
            stockStatus: deriveStockStatus(input.stockQuantity, input.availability),
            active: input.active,
            featured: input.featured,
        };

        const { count } = await tx.product.updateMany({
            where: { id: input.productId, updatedAt: new Date(input.version) },
            data: after,
        });

        if (count === 0) {
            throw new ProductConflictError();
        }

        const changes = Object.fromEntries(
            Object.entries(after)
                .filter(([key, value]) => before[key as keyof typeof before] !== value)
                .map(([key, value]) => [key, { from: before[key as keyof typeof before], to: value }]),
        );

        await recordAudit(tx, admin, {
            action: "product.update",
            entityType: "product",
            entityId: input.productId,
            data: changes,
        });

        return true;
    });
}

export async function getProductAuditLog(productId: string) {
    return db.adminAuditLog.findMany({
        where: { entityType: "product", entityId: productId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, actorEmail: true, createdAt: true, data: true },
    });
}
