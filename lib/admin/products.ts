import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/list-params";
import type { ProductCreateInput, ProductDetailsInput } from "@/lib/admin/product-details-schema";
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

/** Publishing needs a photo: the storefront shows every product with one. */
export class ProductWithoutImagesError extends Error {
    constructor() {
        super("Adicione pelo menos uma fotografia antes de tornar o produto visível.");
        this.name = "ProductWithoutImagesError";
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

        if (input.active && !before.active && (await tx.productImage.count({ where: { productId: input.productId } })) === 0) {
            throw new ProductWithoutImagesError();
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
        select: { id: true, action: true, actorEmail: true, createdAt: true, data: true },
    });
}

/** Everything the details form edits, plus brand options. */
export async function getProductDetails(id: string) {
    if (!/^[a-z0-9-]{1,64}$/i.test(id)) return null;

    return db.product.findUnique({
        where: { id },
        select: {
            id: true,
            slug: true,
            name: true,
            brandId: true,
            sku: true,
            ean: true,
            shortDescription: true,
            description: true,
            capacity: true,
            zones: true,
            installationType: true,
            widthMm: true,
            heightMm: true,
            depthMm: true,
            weightGrams: true,
            energyClass: true,
            annualEnergyKwh: true,
            noiseDb: true,
            reversibleDoor: true,
            uvProtectedGlass: true,
            ledLighting: true,
            lock: true,
            seoTitle: true,
            seoDescription: true,
            updatedAt: true,
            temperatureZones: { orderBy: { position: "asc" }, select: { position: true, minCelsius: true, maxCelsius: true } },
        },
    });
}

export async function getBrandOptions() {
    return db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function createProduct(admin: Admin, input: ProductCreateInput) {
    return db.$transaction(async (tx) => {
        const product = await tx.product.create({
            data: { ...input.data, temperatureZones: { create: input.zones } },
            select: { id: true, slug: true },
        });

        await recordAudit(tx, admin, {
            action: "product.create",
            entityType: "product",
            entityId: product.id,
            data: { slug: product.slug, sku: input.data.sku },
        });

        return product;
    });
}

/**
 * Saves the product's content and specifications. Same optimistic locking
 * as price/stock edits: a change made since the form was opened is never
 * overwritten.
 */
export async function updateProductDetails(admin: Admin, input: ProductDetailsInput) {
    return db.$transaction(async (tx) => {
        const exists = await tx.product.findUnique({ where: { id: input.productId }, select: { id: true } });

        if (!exists) return false;

        const { count } = await tx.product.updateMany({
            where: { id: input.productId, updatedAt: new Date(input.version) },
            data: input.data,
        });

        if (count === 0) throw new ProductConflictError();

        await tx.productTemperatureZone.deleteMany({ where: { productId: input.productId } });
        await tx.productTemperatureZone.createMany({
            data: input.zones.map((zone) => ({ ...zone, productId: input.productId })),
        });

        await recordAudit(tx, admin, {
            action: "product.details_update",
            entityType: "product",
            entityId: input.productId,
            data: { fields: Object.keys(input.data) },
        });

        return true;
    });
}
