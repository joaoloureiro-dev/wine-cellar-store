/**
 * Development seed. Idempotent: upserts by slug, so it can be re-run safely.
 * Run with `npm run db:seed` (also runs after `prisma migrate reset`).
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
    InstallationType,
    PrismaClient,
    StockStatus,
} from "../generated/prisma/client";
import { brands } from "./seed-data/brands";
import { categories } from "./seed-data/categories";
import { products, type SeedProduct } from "./seed-data/products";

const installationTypes = {
    freestanding: InstallationType.FREESTANDING,
    "built-in": InstallationType.BUILT_IN,
    undercounter: InstallationType.UNDERCOUNTER,
} as const;

const stockStatuses = {
    in_stock: StockStatus.IN_STOCK,
    low_stock: StockStatus.LOW_STOCK,
    out_of_stock: StockStatus.OUT_OF_STOCK,
    preorder: StockStatus.PREORDER,
} as const;

const toCents = (euros: number) => Math.round(euros * 100);
const toMm = (cm: number) => Math.round(cm * 10);

function toProductData(product: SeedProduct, brandId: string) {
    return {
        sku: product.sku,
        ean: product.ean ?? null,
        name: product.name,
        brandId,
        shortDescription: product.shortDescription,
        description: product.description,
        priceCents: toCents(product.price),
        compareAtPriceCents:
            product.compareAtPrice === undefined ? null : toCents(product.compareAtPrice),
        capacity: product.capacity,
        zones: product.zones,
        installationType: installationTypes[product.installationType],
        widthMm: toMm(product.dimensions.width),
        heightMm: toMm(product.dimensions.height),
        depthMm: toMm(product.dimensions.depth),
        weightGrams: product.weight === undefined ? null : Math.round(product.weight * 1000),
        energyClass: product.energyClass ?? null,
        annualEnergyKwh: product.annualEnergyConsumption ?? null,
        noiseDb: product.noiseLevel ?? null,
        reversibleDoor: product.reversibleDoor ?? null,
        uvProtectedGlass: product.uvProtectedGlass ?? null,
        ledLighting: product.ledLighting ?? null,
        lock: product.lock ?? null,
        stockQuantity: product.stockQuantity,
        stockStatus: stockStatuses[product.stockStatus],
        featured: product.featured,
        active: product.active,
        seoTitle: product.seo.title,
        seoDescription: product.seo.description,
        createdAt: new Date(product.createdAt),
    };
}

async function main() {
    const db = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });

    try {
        const brandIds = new Map<string, string>();

        for (const brand of brands) {
            const { id } = await db.brand.upsert({
                where: { slug: brand.slug },
                create: brand,
                update: brand,
            });

            brandIds.set(brand.name, id);
        }

        const categoryIds = new Map<string, string>();

        for (const category of categories) {
            const { id } = await db.category.upsert({ where: { slug: category.slug }, create: category, update: category });
            categoryIds.set(category.slug, id);
        }

        for (const product of products) {
            const brandId = brandIds.get(product.brand);

            if (!brandId) {
                throw new Error(`Unknown brand "${product.brand}" for ${product.slug}`);
            }

            const data = toProductData(product, brandId);
            const zones = product.temperatureRanges.map((range, index) => ({
                position: index + 1,
                minCelsius: range.min,
                maxCelsius: range.max,
            }));
            const images = product.images.map((url, index) => ({
                url,
                position: index + 1,
            }));

            await db.$transaction(async (tx) => {
                const { id } = await tx.product.upsert({
                    where: { slug: product.slug },
                    create: { id: product.id, slug: product.slug, ...data },
                    update: data,
                });

                await tx.productTemperatureZone.deleteMany({ where: { productId: id } });
                await tx.productImage.deleteMany({ where: { productId: id } });
                await tx.productTemperatureZone.createMany({
                    data: zones.map((zone) => ({ ...zone, productId: id })),
                });
                await tx.productImage.createMany({
                    data: images.map((image) => ({ ...image, productId: id })),
                });
                await tx.productCategory.deleteMany({ where: { productId: id } });
                await tx.productCategory.createMany({
                    data: product.categories.map((slug) => ({ productId: id, categoryId: categoryIds.get(slug)! })),
                });
            });
        }

        console.log(`Seeded ${brands.length} brands, ${categories.length} categories and ${products.length} products.`);
    } finally {
        await db.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
