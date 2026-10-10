-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('WINE_CELLAR', 'CLIMATE_UNIT', 'WINE_RACK', 'ACCESSORY');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'WINE_CELLAR';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "coolingPowerW" INTEGER,
ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'WINE_CELLAR',
ADD COLUMN     "material" TEXT,
ADD COLUMN     "roomVolumeM3" INTEGER,
ALTER COLUMN "capacity" DROP NOT NULL,
ALTER COLUMN "zones" DROP NOT NULL,
ALTER COLUMN "installationType" DROP NOT NULL,
ALTER COLUMN "widthMm" DROP NOT NULL,
ALTER COLUMN "heightMm" DROP NOT NULL,
ALTER COLUMN "depthMm" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Product_kind_active_idx" ON "Product"("kind", "active");

-- Each kind keeps the fields it cannot do without.
ALTER TABLE "Product" ADD CONSTRAINT "Product_kind_required_fields" CHECK (
  CASE "kind"
    WHEN 'WINE_CELLAR' THEN "capacity" IS NOT NULL AND "zones" IS NOT NULL AND "installationType" IS NOT NULL
                            AND "widthMm" IS NOT NULL AND "heightMm" IS NOT NULL AND "depthMm" IS NOT NULL
    WHEN 'CLIMATE_UNIT' THEN "roomVolumeM3" IS NOT NULL
    WHEN 'WINE_RACK' THEN "capacity" IS NOT NULL
    ELSE TRUE
  END
);
