# Fix Location Field Build Errors

## Problem

The Prisma contract schema has been updated with the `location` field, but:
1. The database table doesn't have the column yet
2. The generated TypeScript types are out of sync

## Solution

Follow these steps in order:

### Step 1: Add Location Column to Database

You have two options:

#### Option A: Using your database admin panel (Recommended)

Go to your Prisma database dashboard (db.prisma.io) and run this SQL:

```sql
ALTER TABLE "Participant" 
ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';
```

#### Option B: Using the migration script

Run:
```bash
node scripts/migrate-add-location.mjs
```

### Step 2: Regenerate Prisma Contract Types

After the database is updated, regenerate the TypeScript types:

```bash
pnpm contract:emit
```

This will update `prisma/contract.d.ts` and `prisma/contract.json` with the new `location` field.

### Step 3: Build

Now the build should succeed:

```bash
pnpm build
```

---

## Alternative: If Database Already Has the Column

If you already ran the migration but types are still out of sync, just run:

```bash
pnpm contract:emit
pnpm build
```

---

## Quick One-Liner

```bash
# Run these in sequence:
pnpm contract:emit && pnpm build
```

If that fails with the same error, the database doesn't have the column yet. Add it first (Step 1 above).

---

## Verify Database Has Column

To check if the location column exists:

**SQL:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Participant' 
  AND column_name = 'location';
```

**Should return:**
```
column_name | data_type
------------|----------
location    | text
```

If it returns no rows, the column doesn't exist yet.

---

## Fresh Install

If you're setting up a new database from scratch, use the updated `init-database.sql`:

```bash
psql "$DATABASE_URL" -f init-database.sql
```

This already includes the location field.

---

## What Changed

**Before:**
```typescript
type Participant = {
  id: string;
  name: string;
  phoneNumber: string;
  serialNumber: number;
  selectedNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**After:**
```typescript
type Participant = {
  id: string;
  name: string;
  phoneNumber: string;
  location: string;        // ← NEW
  serialNumber: number;
  selectedNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Troubleshooting

### Error: "Property 'location' does not exist"

**Cause:** TypeScript types not regenerated  
**Fix:** Run `pnpm contract:emit`

### Error: "column 'location' does not exist"

**Cause:** Database doesn't have the column  
**Fix:** Run the ALTER TABLE SQL (Step 1)

### contract:emit hangs or fails

**Possible causes:**
1. Database connection issue
2. Prisma ORM version mismatch

**Fix:**
1. Check `.env` has correct `DATABASE_URL`
2. Verify you can connect: `psql "$DATABASE_URL" -c "SELECT 1;"`
3. Check Prisma version: `pnpm list prisma`

---

## Summary

The correct order is:

1. **Database**: Add the `location` column (ALTER TABLE)
2. **Prisma**: Regenerate types (`pnpm contract:emit`)
3. **Build**: Compile the app (`pnpm build`)

Skip step 1 if the column already exists in your database.
