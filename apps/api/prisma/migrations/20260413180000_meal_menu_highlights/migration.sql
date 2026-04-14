-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "richInProtein" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "richInFiber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "richInLowCarb" BOOLEAN NOT NULL DEFAULT false;
