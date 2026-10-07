import { randomUUID } from "node:crypto";

import type { CheckoutInput } from "@/lib/checkout/schema";
import { db } from "@/lib/db";

/** Empties every application table (keeps the migrations table). */
export async function resetDatabase() {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `;
    const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");

    await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let sequence = 0;

/** Creates an active product (and its brand) with the given stock. */
export async function createProduct({
    stock,
    priceCents = 49_900,
    stockStatus,
}: {
    stock: number;
    priceCents?: number;
    stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";
}) {
    sequence += 1;
    const brand = await db.brand.upsert({
        where: { slug: "test-brand" },
        update: {},
        create: { slug: "test-brand", name: "Test Brand", country: "PT", description: "Marca de teste." },
    });

    return db.product.create({
        data: {
            id: `product-${sequence}`,
            slug: `product-${sequence}`,
            sku: `SKU-${sequence}`,
            name: `Cave ${sequence}`,
            brandId: brand.id,
            shortDescription: "Cave de teste.",
            description: "Cave de teste.",
            priceCents,
            capacity: 24,
            zones: 1,
            installationType: "FREESTANDING",
            widthMm: 400,
            heightMm: 800,
            depthMm: 500,
            stockQuantity: stock,
            stockStatus: stockStatus ?? (stock === 0 ? "OUT_OF_STOCK" : stock <= 3 ? "LOW_STOCK" : "IN_STOCK"),
            seoTitle: "Cave",
            seoDescription: "Cave",
        },
    });
}

export function checkoutInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
    return {
        idempotencyKey: randomUUID(),
        name: "Rita Silva",
        email: "rita@example.pt",
        phone: "912345678",
        taxId: undefined,
        addressLine1: "Rua das Flores 10",
        addressLine2: undefined,
        postalCode: "1000-001",
        city: "Lisboa",
        shippingMethod: "home-delivery",
        customerNotes: undefined,
        paymentMethod: "BANK_TRANSFER",
        termsAccepted: "on",
        ...overrides,
    };
}

export async function stockOf(productId: string) {
    const product = await db.product.findUniqueOrThrow({
        where: { id: productId },
        select: { stockQuantity: true, stockStatus: true },
    });

    return product;
}
