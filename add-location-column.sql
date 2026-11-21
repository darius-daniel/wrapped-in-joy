-- Migration: Add location column to Participant table
-- Run this if you already have an existing database with participants

-- Add the location column (allows NULL initially)
ALTER TABLE "Participant" 
ADD COLUMN IF NOT EXISTS "location" TEXT;

-- For existing records, you can either:
-- Option 1: Set a default value for all existing records
-- UPDATE "Participant" SET "location" = 'Not specified' WHERE "location" IS NULL;

-- Option 2: Set location to NOT NULL after updating existing records
-- ALTER TABLE "Participant" ALTER COLUMN "location" SET NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Participant'
ORDER BY ordinal_position;
