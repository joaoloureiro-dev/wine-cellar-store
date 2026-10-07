-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "stockHeld" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Reservation_status_expiresAt_idx" ON "Reservation"("status", "expiresAt");
