-- Add SUSPENDED to RiderApprovalStatus enum
ALTER TYPE "RiderApprovalStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
