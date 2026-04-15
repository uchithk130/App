-- New enums
CREATE TYPE "BankVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'VERIFICATION_IN_PROGRESS', 'VERIFIED', 'VERIFICATION_FAILED');
CREATE TYPE "EditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EditRequestType" AS ENUM ('PROFILE', 'BANK_DETAILS');

-- Extend RiderProfile with new columns
ALTER TABLE "RiderProfile" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "RiderProfile" ADD COLUMN "emergencyContact" TEXT;
ALTER TABLE "RiderProfile" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "RiderProfile" ADD COLUMN "address" TEXT;
ALTER TABLE "RiderProfile" ADD COLUMN "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- RiderBankAccount table
CREATE TABLE "RiderBankAccount" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "maskedAccountNumber" TEXT NOT NULL,
    "accountNumberEncrypted" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT,
    "upiId" TEXT,
    "verificationStatus" "BankVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "verificationProvider" TEXT,
    "verificationReferenceId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "approvedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RiderBankAccount_riderId_key" ON "RiderBankAccount"("riderId");
CREATE INDEX "RiderBankAccount_verificationStatus_idx" ON "RiderBankAccount"("verificationStatus");

ALTER TABLE "RiderBankAccount" ADD CONSTRAINT "RiderBankAccount_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RiderEditRequest table
CREATE TABLE "RiderEditRequest" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "requestType" "EditRequestType" NOT NULL,
    "status" "EditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "currentDataJson" JSONB,
    "submittedDataJson" JSONB NOT NULL,
    "maskedAccountNumber" TEXT,
    "accountNumberEncrypted" TEXT,
    "verificationStatus" "BankVerificationStatus",
    "verificationProvider" TEXT,
    "verificationReferenceId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderEditRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiderEditRequest_riderId_requestType_status_idx" ON "RiderEditRequest"("riderId", "requestType", "status");
CREATE INDEX "RiderEditRequest_status_requestType_createdAt_idx" ON "RiderEditRequest"("status", "requestType", "createdAt");

ALTER TABLE "RiderEditRequest" ADD CONSTRAINT "RiderEditRequest_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add bankAccountId to WithdrawalRequest
ALTER TABLE "WithdrawalRequest" ADD COLUMN "bankAccountId" TEXT;
