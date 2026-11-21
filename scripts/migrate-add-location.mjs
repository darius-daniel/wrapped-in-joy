import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Connecting to database...');

// Create a raw postgres connection
const sql = postgres(DATABASE_URL);

async function migrate() {
  try {
    console.log('Adding location column...');
    
    const result = await sql`
      ALTER TABLE "Participant" 
      ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';
    `;
    
    console.log('✅ Migration successful!');
    console.log('\nNext step: Run pnpm contract:emit to regenerate types');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    
    if (error.message.includes('column "location" of relation "Participant" already exists')) {
      console.log('\n✅ Column already exists - migration not needed!');
      console.log('Just run: pnpm contract:emit');
    }
  } finally {
    await sql.end();
  }
}

migrate();
