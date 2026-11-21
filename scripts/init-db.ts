import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres({
  url: DATABASE_URL,
});

async function initDB() {
  try {
    console.log('Initializing database...');

    // Create the Participant table
    await sql`
      CREATE TABLE IF NOT EXISTS "Participant" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phoneNumber" TEXT NOT NULL,
        "serialNumber" INTEGER NOT NULL UNIQUE,
        "selectedNumber" INTEGER UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS "Participant_serialNumber_idx" ON "Participant"("serialNumber")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "Participant_selectedNumber_idx" ON "Participant"("selectedNumber")
    `;

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

initDB().catch(console.error);
