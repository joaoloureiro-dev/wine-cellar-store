import "server-only";

import type { Prisma } from "@/generated/prisma/client";

/** At or below this quantity a purchasable product shows "Últimas unidades". */
export const LOW_STOCK_THRESHOLD = 3;

type Tx = Prisma.TransactionClient;

/**
 * Atomically holds `quantity` units of a product.
 *
 * A single conditional UPDATE (no read-then-write) guarantees that two
 * concurrent buyers can never both take the last unit: the row lock makes
 * the second statement re-check `stockQuantity >= quantity` and match 0 rows.
 * The stock status is recalculated in the same statement.
 *
 * @returns true when the units were reserved.
 */
export async function reserveStock(tx: Tx, productId: string, quantity: number) {
    const updated = await tx.$executeRaw`
        UPDATE "Product"
        SET "stockQuantity" = "stockQuantity" - ${quantity},
            "stockStatus" = CASE
                WHEN "stockQuantity" - ${quantity} = 0 THEN 'OUT_OF_STOCK'::"StockStatus"
                WHEN "stockQuantity" - ${quantity} <= ${LOW_STOCK_THRESHOLD} THEN 'LOW_STOCK'::"StockStatus"
                ELSE "stockStatus"
            END,
            "updatedAt" = NOW()
        WHERE "id" = ${productId}
          AND "active" = true
          AND "stockStatus" IN ('IN_STOCK'::"StockStatus", 'LOW_STOCK'::"StockStatus")
          AND "stockQuantity" >= ${quantity}
    `;

    return updated === 1;
}

/**
 * Returns held units to stock (cancelled or expired order). Products that an
 * admin moved to PREORDER keep that status; others are recalculated.
 */
export async function releaseStock(tx: Tx, productId: string, quantity: number) {
    await tx.$executeRaw`
        UPDATE "Product"
        SET "stockQuantity" = "stockQuantity" + ${quantity},
            "stockStatus" = CASE
                WHEN "stockStatus" = 'PREORDER'::"StockStatus" THEN "stockStatus"
                WHEN "stockQuantity" + ${quantity} <= ${LOW_STOCK_THRESHOLD} THEN 'LOW_STOCK'::"StockStatus"
                ELSE 'IN_STOCK'::"StockStatus"
            END,
            "updatedAt" = NOW()
        WHERE "id" = ${productId}
    `;
}
