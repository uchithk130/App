-- Add isActive, isFeatured, description to MealCategory
ALTER TABLE "MealCategory" ADD COLUMN "description" TEXT;
ALTER TABLE "MealCategory" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MealCategory" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient customer queries
CREATE INDEX "MealCategory_isActive_sortOrder_idx" ON "MealCategory"("isActive", "sortOrder");
