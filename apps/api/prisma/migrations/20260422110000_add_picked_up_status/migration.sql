-- AlterEnum: add PICKED_UP to OrderStatus
-- Add PICKED_UP enum value (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PICKED_UP' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
    ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP' AFTER 'ASSIGNED';
  END IF;
END $$;
