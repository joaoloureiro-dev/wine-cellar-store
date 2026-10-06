-- CreateEnum
CREATE TYPE "InstallationType" AS ENUM ('FREESTANDING', 'BUILT_IN', 'UNDERCOUNTER');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PREORDER');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "ean" TEXT,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "compareAtPriceCents" INTEGER,
    "capacity" INTEGER NOT NULL,
    "zones" INTEGER NOT NULL,
    "installationType" "InstallationType" NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "depthMm" INTEGER NOT NULL,
    "weightGrams" INTEGER,
    "energyClass" TEXT,
    "annualEnergyKwh" INTEGER,
    "noiseDb" INTEGER,
    "reversibleDoor" BOOLEAN,
    "uvProtectedGlass" BOOLEAN,
    "ledLighting" BOOLEAN,
    "lock" BOOLEAN,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'OUT_OF_STOCK',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTemperatureZone" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "minCelsius" INTEGER NOT NULL,
    "maxCelsius" INTEGER NOT NULL,

    CONSTRAINT "ProductTemperatureZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_ean_key" ON "Product"("ean");

-- CreateIndex
CREATE INDEX "Product_active_featured_idx" ON "Product"("active", "featured");

-- CreateIndex
CREATE INDEX "Product_brandId_active_idx" ON "Product"("brandId", "active");

-- CreateIndex
CREATE INDEX "Product_active_capacity_idx" ON "Product"("active", "capacity");

-- CreateIndex
CREATE INDEX "Product_active_priceCents_idx" ON "Product"("active", "priceCents");

-- CreateIndex
CREATE INDEX "Product_active_createdAt_idx" ON "Product"("active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTemperatureZone_productId_position_key" ON "ProductTemperatureZone"("productId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_position_key" ON "ProductImage"("productId", "position");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemperatureZone" ADD CONSTRAINT "ProductTemperatureZone_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity rules enforced by the database (not expressible in Prisma schema).
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_priceCents_check" CHECK ("priceCents" >= 0),
  ADD CONSTRAINT "Product_compareAtPriceCents_check" CHECK ("compareAtPriceCents" IS NULL OR "compareAtPriceCents" >= 0),
  ADD CONSTRAINT "Product_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "Product_zones_check" CHECK ("zones" BETWEEN 1 AND 3),
  ADD CONSTRAINT "Product_dimensions_check" CHECK ("widthMm" > 0 AND "heightMm" > 0 AND "depthMm" > 0),
  ADD CONSTRAINT "Product_stockQuantity_check" CHECK ("stockQuantity" >= 0);

ALTER TABLE "ProductTemperatureZone"
  ADD CONSTRAINT "ProductTemperatureZone_range_check" CHECK ("minCelsius" <= "maxCelsius"),
  ADD CONSTRAINT "ProductTemperatureZone_position_check" CHECK ("position" BETWEEN 1 AND 3);
