import 'dotenv/config';
import { db } from '../prisma/db.ts';

async function initDB() {
  try {
    console.log('Initializing database...');

    // Try to create a test participant to see if table exists
    const count = await db.orm.public.Participant.count();
    console.log('✅ Database is accessible! Current participant count:', count);
  } catch (error) {
    console.error('Error accessing database:', error.message);
    console.log('\nYou may need to create the table manually using the SQL:');
    console.log(`
CREATE TABLE IF NOT EXISTS "Participant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "serialNumber" INTEGER NOT NULL UNIQUE,
  "selectedNumber" INTEGER UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "Participant_serialNumber_idx" ON "Participant"("serialNumber");
CREATE INDEX IF NOT EXISTS "Participant_selectedNumber_idx" ON "Participant"("selectedNumber");
    `);
  }
}

initDB().catch(console.error);
