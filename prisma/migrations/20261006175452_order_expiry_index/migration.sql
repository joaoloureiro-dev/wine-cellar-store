-- CreateIndex
CREATE INDEX "Order_status_paymentDueAt_idx" ON "Order"("status", "paymentDueAt");
