import { existsSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { addProductImage, deleteImage, MAX_IMAGES_PER_PRODUCT, moveImage, ProductImageError } from "@/lib/admin/product-images";
import { ProductWithoutImagesError, updateProduct } from "@/lib/admin/products";
import { db } from "@/lib/db";
import { getMediaStorage } from "@/lib/media/storage";
import { createProduct, resetDatabase } from "../support/db";

let admin: { id: string; name: string; email: string };

beforeEach(async () => {
    await resetDatabase();
    admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });
});

const png = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(32).fill(0)])], "cave.png", { type: "image/png" });
const storedFile = (url: string) => path.resolve(process.env.MEDIA_LOCAL_DIR!, getMediaStorage().keyFor(url)!);
const positions = async (productId: string) =>
    (await db.productImage.findMany({ where: { productId }, orderBy: { position: "asc" }, select: { alt: true } })).map((image) => image.alt);

async function hiddenProduct() {
    const product = await createProduct({ stock: 2 });
    await db.product.update({ where: { id: product.id }, data: { active: false } });
    return product;
}

describe("product photos", () => {
    it("stores valid photos in order and reorders them", async () => {
        const product = await hiddenProduct();
        await addProductImage(admin, { productId: product.id, file: png(), alt: "Frente" });
        const side = await addProductImage(admin, { productId: product.id, file: png(), alt: "Lado" });

        const stored = await db.productImage.findUniqueOrThrow({ where: { id: side.id } });
        expect(existsSync(storedFile(stored.url))).toBe(true);

        await moveImage(admin, { imageId: side.id, direction: "up" });
        expect(await positions(product.id)).toEqual(["Lado", "Frente"]);
    });

    it.each([
        ["a file disguised as an image", new File(['<svg onload="alert(1)"></svg>'], "x.png", { type: "image/png" }), /Formato/],
        ["a file over 4 MB", new File([new Uint8Array(4 * 1024 * 1024 + 1).fill(0xff)], "x.jpg"), /4 MB/],
        ["an empty file", new File([], "x.jpg"), /Escolha/],
    ])("rejects %s", async (_name, file, message) => {
        const product = await hiddenProduct();

        await expect(addProductImage(admin, { productId: product.id, file, alt: "Cave" })).rejects.toThrow(message);
        expect(await db.productImage.count()).toBe(0);
    });

    it(`limits a product to ${MAX_IMAGES_PER_PRODUCT} photos`, async () => {
        const product = await hiddenProduct();
        await db.productImage.createMany({
            data: Array.from({ length: MAX_IMAGES_PER_PRODUCT }, (_, index) => ({ productId: product.id, url: `/images/products/${index}.webp`, position: index + 1 })),
        });

        await expect(addProductImage(admin, { productId: product.id, file: png(), alt: "Cave" })).rejects.toBeInstanceOf(ProductImageError);
    });

    it("removes the record and the file, but never a visible product's last photo", async () => {
        const product = await hiddenProduct();
        const first = await addProductImage(admin, { productId: product.id, file: png(), alt: "Frente" });
        const second = await addProductImage(admin, { productId: product.id, file: png(), alt: "Lado" });
        const { url } = await db.productImage.findUniqueOrThrow({ where: { id: first.id } });
        await db.product.update({ where: { id: product.id }, data: { active: true } });

        await deleteImage(admin, { imageId: first.id });
        expect(existsSync(storedFile(url))).toBe(false);

        await expect(deleteImage(admin, { imageId: second.id })).rejects.toBeInstanceOf(ProductImageError);
        expect(await positions(product.id)).toEqual(["Lado"]);
    });

    it("never leaves a visible product without photos under concurrent edits", async () => {
        for (let round = 0; round < 5; round += 1) {
            const product = await hiddenProduct();
            const image = await addProductImage(admin, { productId: product.id, file: png(), alt: "Frente" });
            const { updatedAt } = await db.product.findUniqueOrThrow({ where: { id: product.id } });

            await Promise.allSettled([
                updateProduct(admin, {
                    productId: product.id,
                    version: updatedAt.getTime(),
                    price: 49_900,
                    compareAtPrice: null,
                    stockQuantity: 2,
                    availability: "auto",
                    active: true,
                    featured: false,
                }),
                deleteImage(admin, { imageId: image.id }),
            ]).then((results) => {
                for (const result of results) {
                    if (result.status === "rejected") {
                        expect(result.reason).toSatisfy((error) => error instanceof ProductImageError || error instanceof ProductWithoutImagesError);
                    }
                }
            });

            const after = await db.product.findUniqueOrThrow({ where: { id: product.id }, select: { active: true, _count: { select: { images: true } } } });
            expect(after.active && after._count.images === 0).toBe(false);
        }
    });
});
