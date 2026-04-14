-- CreateEnum
CREATE TYPE "RiderApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "RiderProfile" ADD COLUMN "approvalStatus" "RiderApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "vehicleNumber" TEXT;

UPDATE "RiderProfile" SET "approvalStatus" = 'APPROVED', "approvedAt" = COALESCE("updatedAt", "createdAt");

CREATE INDEX "RiderProfile_approvalStatus_idx" ON "RiderProfile"("approvalStatus");
