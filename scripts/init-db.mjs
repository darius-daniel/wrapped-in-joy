import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Connecting to database...');

const sql = postgres({
  url: DATABASE_URL,
});

async function initDB() {
  try {
    console.log('Creating Participant table...');

    // Drop existing table if needed (comment this out if you want to preserve data)
    // await sql`DROP TABLE IF EXISTS "Participant"`;

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

    console.log('Creating indexes...');

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS "Participant_serialNumber_idx" ON "Participant"("serialNumber")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "Participant_selectedNumber_idx" ON "Participant"("selectedNumber")
    `;

    console.log('✅ Database initialized successfully!');
    console.log('\nYou can now run: pnpm dev');
  } catch (error) {
    console.error('❌ Error initializing database:');
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

initDB();
