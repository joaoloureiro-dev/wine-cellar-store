-- At most one open reservation per customer email and product, guaranteed
-- even under concurrent submissions (the app-level check is only a fast path).
-- Partial unique indexes cannot be expressed in the Prisma schema.
CREATE UNIQUE INDEX "Reservation_open_customer_product_key"
  ON "Reservation" ("customerEmail", "productId")
  WHERE "status" IN ('PENDING', 'CONFIRMED', 'AWAITING_PAYMENT');
