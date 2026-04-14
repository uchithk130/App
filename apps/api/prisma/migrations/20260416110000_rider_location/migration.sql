-- Add rider live-location fields
ALTER TABLE "RiderProfile" ADD COLUMN "lastKnownLat" DECIMAL(10,7);
ALTER TABLE "RiderProfile" ADD COLUMN "lastKnownLng" DECIMAL(10,7);
ALTER TABLE "RiderProfile" ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);
