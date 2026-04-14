-- CreateEnum
CREATE TYPE "MealListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN "listingStatus" "MealListingStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill from isActive
UPDATE "Meal" SET "listingStatus" = CASE WHEN "isActive" THEN 'ACTIVE'::"MealListingStatus" ELSE 'INACTIVE'::"MealListingStatus" END;
