-- CreateEnum
CREATE TYPE "PromoTagType" AS ENUM ('CUSTOM_TEXT', 'ITEMS_AT_PRICE', 'PERCENT_OFF_ABOVE_AMOUNT', 'PERCENT_OFF_UPTO_AMOUNT', 'FLAT_OFF', 'FREE_DELIVERY');

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN "isSpecialOffer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Meal" ADD COLUMN "specialOfferPriority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Meal" ADD COLUMN "promoTagType" "PromoTagType";
ALTER TABLE "Meal" ADD COLUMN "promoTagConfig" JSONB;
ALTER TABLE "Meal" ADD COLUMN "promoTagText" TEXT;

-- CreateIndex
CREATE INDEX "Meal_isSpecialOffer_isActive_idx" ON "Meal"("isSpecialOffer", "isActive");
