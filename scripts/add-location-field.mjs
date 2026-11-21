import 'dotenv/config';
import { db } from '../prisma/db.ts';

async function addLocationColumn() {
  try {
    console.log('Adding location column to Participant table...');

    // Check if column already exists by trying to query it
    try {
      const test = await db.orm.public.Participant.select({ location: true }).first();
      console.log('✅ Location column already exists!');
      return;
    } catch (error) {
      console.log('Column does not exist yet, adding it...');
    }

    // Use raw SQL to add the column
    await db.execute(`
      ALTER TABLE "Participant" 
      ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
    `);

    console.log('✅ Location column added successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: pnpm contract:emit');
    console.log('2. Run: pnpm build');
  } catch (error) {
    console.error('❌ Error adding location column:');
    console.error(error);
    process.exit(1);
  }
}

addLocationColumn();
