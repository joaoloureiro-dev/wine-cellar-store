import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { db } from "@/lib/db";
import { detectImageType } from "@/lib/media/image-type";
import { getMediaStorage } from "@/lib/media/storage";
import { createLogger } from "@/lib/logger";

const logger = createLogger("admin.images");

/** Below Vercel's 4.5 MB request limit, with room for the form fields. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES_PER_PRODUCT = 12;

/** A rule the admin can fix (message shown as is). */
export class ProductImageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProductImageError";
    }
}

/**
 * Serialises changes to one product's photos and its visibility (see
 * updateProduct), so "visible products have a photo" holds under
 * concurrent edits.
 */
async function lockProduct(tx: Prisma.TransactionClient, productId: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
    return rows.length > 0;
}

export async function listProductImages(productId: string) {
    return db.productImage.findMany({
        where: { productId },
        orderBy: { position: "asc" },
        select: { id: true, url: true, alt: true, position: true },
    });
}

/**
 * Validates the file by its content, stores it, then records it as the
 * product's last photo. If the database write fails, the stored file is
 * removed again.
 */
export async function addProductImage(admin: Admin, { productId, file, alt }: { productId: string; file: File; alt: string }) {
    if (file.size === 0) throw new ProductImageError("Escolha uma fotografia.");
    if (file.size > MAX_IMAGE_BYTES) throw new ProductImageError("A fotografia tem de ter no máximo 4 MB.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);

    if (!type) throw new ProductImageError("Formato não suportado. Use JPEG, PNG, WebP ou AVIF.");

    if (!(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
        throw new ProductImageError("Produto não encontrado.");
    }

    const storage = getMediaStorage();
    const key = `products/${productId}/${randomUUID()}.${type.extension}`;
    await storage.put(key, bytes, type.contentType);

    try {
        return await db.$transaction(async (tx) => {
            if (!(await lockProduct(tx, productId))) throw new ProductImageError("Produto não encontrado.");

            if ((await tx.productImage.count({ where: { productId } })) >= MAX_IMAGES_PER_PRODUCT) {
                throw new ProductImageError(`Máximo de ${MAX_IMAGES_PER_PRODUCT} fotografias por produto.`);
            }

            const last = await tx.productImage.aggregate({ where: { productId }, _max: { position: true } });
            const image = await tx.productImage.create({
                data: { productId, url: storage.urlFor(key), alt, position: (last._max.position ?? 0) + 1 },
                select: { id: true },
            });

            await recordAudit(tx, admin, { action: "product.image_add", entityType: "product", entityId: productId, data: { imageId: image.id } });
            return image;
        });
    } catch (error) {
        await removeStoredFile(key);
        throw error;
    }
}

export async function updateImageAlt(admin: Admin, { imageId, alt }: { imageId: string; alt: string }) {
    return db.$transaction(async (tx) => {
        const image = await tx.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
        if (!image) return null;

        await tx.productImage.update({ where: { id: imageId }, data: { alt } });
        await recordAudit(tx, admin, { action: "product.image_update", entityType: "product", entityId: image.productId, data: { imageId } });
        return image.productId;
    });
}

/** Swaps the photo with its neighbour; the first photo is the main one. */
export async function moveImage(admin: Admin, { imageId, direction }: { imageId: string; direction: "up" | "down" }) {
    return db.$transaction(async (tx) => {
        const image = await tx.productImage.findUnique({ where: { id: imageId }, select: { productId: true, position: true } });
        if (!image) return null;

        const neighbour = await tx.productImage.findFirst({
            where: { productId: image.productId, position: direction === "up" ? { lt: image.position } : { gt: image.position } },
            orderBy: { position: direction === "up" ? "desc" : "asc" },
            select: { id: true, position: true },
        });

        if (!neighbour) return image.productId;

        // (productId, position) is unique: park one image while swapping.
        await tx.productImage.update({ where: { id: imageId }, data: { position: -1 } });
        await tx.productImage.update({ where: { id: neighbour.id }, data: { position: image.position } });
        await tx.productImage.update({ where: { id: imageId }, data: { position: neighbour.position } });

        await recordAudit(tx, admin, { action: "product.image_move", entityType: "product", entityId: image.productId, data: { imageId, direction } });
        return image.productId;
    });
}

/** A visible product keeps at least one photo. The file is removed after the record. */
export async function deleteImage(admin: Admin, { imageId }: { imageId: string }) {
    const removed = await db.$transaction(async (tx) => {
        const target = await tx.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
        if (!target || !(await lockProduct(tx, target.productId))) return null;

        const image = await tx.productImage.findUnique({
            where: { id: imageId },
            select: { productId: true, url: true, product: { select: { active: true, _count: { select: { images: true } } } } },
        });
        if (!image) return null;

        if (image.product.active && image.product._count.images <= 1) {
            throw new ProductImageError("Um produto visível na loja precisa de pelo menos uma fotografia. Oculte-o primeiro.");
        }

        await tx.productImage.delete({ where: { id: imageId } });
        await recordAudit(tx, admin, { action: "product.image_delete", entityType: "product", entityId: image.productId, data: { imageId } });
        return image;
    });

    if (!removed) return null;

    const key = getMediaStorage().keyFor(removed.url);
    if (key) await removeStoredFile(key);

    return removed.productId;
}

/** Best effort: an orphaned file costs storage, never a broken page. */
async function removeStoredFile(key: string) {
    try {
        await getMediaStorage().remove(key);
    } catch (error) {
        logger.warn("Could not remove stored photo", { key, error });
    }
}
