-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "appliesToAllCustomers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "appliesToAllMeals" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CouponCustomer" (
    "couponId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "CouponCustomer_pkey" PRIMARY KEY ("couponId","customerId")
);

-- CreateTable
CREATE TABLE "CouponMeal" (
    "couponId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,

    CONSTRAINT "CouponMeal_pkey" PRIMARY KEY ("couponId","mealId")
);

-- CreateIndex
CREATE INDEX "CouponCustomer_customerId_idx" ON "CouponCustomer"("customerId");

-- CreateIndex
CREATE INDEX "CouponMeal_mealId_idx" ON "CouponMeal"("mealId");

-- AddForeignKey
ALTER TABLE "CouponCustomer" ADD CONSTRAINT "CouponCustomer_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCustomer" ADD CONSTRAINT "CouponCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponMeal" ADD CONSTRAINT "CouponMeal_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponMeal" ADD CONSTRAINT "CouponMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
