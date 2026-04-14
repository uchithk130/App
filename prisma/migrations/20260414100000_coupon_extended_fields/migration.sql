-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "title" TEXT;
ALTER TABLE "Coupon" ADD COLUMN "freeShipping" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Coupon" ADD COLUMN "maxDiscount" DECIMAL(10,2);
ALTER TABLE "Coupon" ADD COLUMN "minOrderAmount" DECIMAL(10,2);
ALTER TABLE "Coupon" ADD COLUMN "perUserLimit" INTEGER;
ALTER TABLE "Coupon" ADD COLUMN "validFrom" TIMESTAMP(3);
ALTER TABLE "Coupon" ADD COLUMN "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Coupon" ADD COLUMN "termsAndConditions" TEXT;
ALTER TABLE "Coupon" ADD COLUMN "displayBadge" TEXT;
ALTER TABLE "Coupon" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Coupon_sortOrder_idx" ON "Coupon"("sortOrder");
