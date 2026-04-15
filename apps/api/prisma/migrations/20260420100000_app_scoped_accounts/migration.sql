-- CreateEnum: AppScope
CREATE TYPE "AppScope" AS ENUM ('CUSTOMER', 'RIDER', 'ADMIN');

-- AlterTable: Add appScope column with default
ALTER TABLE "User" ADD COLUMN "appScope" "AppScope";

-- Backfill: Assign appScope based on existing roles
UPDATE "User" u SET "appScope" = 'CUSTOMER'
WHERE u."appScope" IS NULL
  AND EXISTS (
    SELECT 1 FROM "UserOnRole" ur
    JOIN "Role" r ON r."id" = ur."roleId"
    WHERE ur."userId" = u."id" AND r."code" = 'CUSTOMER'
  );

UPDATE "User" u SET "appScope" = 'RIDER'
WHERE u."appScope" IS NULL
  AND EXISTS (
    SELECT 1 FROM "UserOnRole" ur
    JOIN "Role" r ON r."id" = ur."roleId"
    WHERE ur."userId" = u."id" AND r."code" = 'RIDER'
  );

UPDATE "User" u SET "appScope" = 'ADMIN'
WHERE u."appScope" IS NULL
  AND EXISTS (
    SELECT 1 FROM "UserOnRole" ur
    JOIN "Role" r ON r."id" = ur."roleId"
    WHERE ur."userId" = u."id" AND r."code" = 'ADMIN'
  );

-- Fallback: any remaining users default to CUSTOMER
UPDATE "User" SET "appScope" = 'CUSTOMER' WHERE "appScope" IS NULL;

-- Make appScope NOT NULL now that all rows are backfilled
ALTER TABLE "User" ALTER COLUMN "appScope" SET NOT NULL;

-- Drop old unique indexes
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_phone_key";

-- Add new app-scoped unique constraint
CREATE UNIQUE INDEX "User_email_appScope_key" ON "User"("email", "appScope");

-- Add index on email for lookups
CREATE INDEX "User_email_idx" ON "User"("email");
