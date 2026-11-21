-- Gift Exchange Database Initialization
-- Run this SQL against your PostgreSQL database to create the necessary table and indexes

-- Create the Participant table
CREATE TABLE IF NOT EXISTS "Participant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "serialNumber" INTEGER NOT NULL UNIQUE,
  "selectedNumber" INTEGER UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Participant_serialNumber_idx" 
  ON "Participant"("serialNumber");

CREATE INDEX IF NOT EXISTS "Participant_selectedNumber_idx" 
  ON "Participant"("selectedNumber");

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'Participant'
ORDER BY 
  ordinal_position;

-- Show count (should be 0 initially)
SELECT COUNT(*) as participant_count FROM "Participant";
