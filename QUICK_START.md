# Quick Start Guide

## Initial Setup (One Time Only)

```bash
# 1. Make sure you have the database URL in .env
cat .env  # Should show DATABASE_URL

# 2. Install dependencies (if not already done)
pnpm install

# 3. Create the database table
pnpm db:init

# 4. Generate Prisma types
pnpm contract:emit

# 5. Start the dev server
pnpm dev
```

## Development Workflow

```bash
# Start the server
pnpm dev

# Visit the app
open http://localhost:3000/signup
```

## If You Make Schema Changes

```bash
# 1. Edit prisma/contract.prisma

# 2. Regenerate types
pnpm contract:emit

# 3. Update database (manual SQL for now)
# Or drop and recreate with pnpm db:init
```

## Common Issues

**Problem**: Type errors in IDE
**Solution**: `pnpm contract:emit`

**Problem**: Table doesn't exist
**Solution**: `pnpm db:init`

**Problem**: Available numbers not showing
**Solution**: Check database has participants, check console for errors

**Problem**: First participant sees dropdown
**Solution**: Check if database is empty (should be 0 participants)

## Test the Flow

1. Register first person → No dropdown, just name & phone
2. Register second person → Dropdown shows first person
3. Check: First person's `selectedNumber` should now be 2
4. Register third person → Dropdown shows only unselected participants

## Quick Database Queries

```sql
-- View all participants
SELECT "serialNumber", "name", "selectedNumber"
FROM "Participant"
ORDER BY "serialNumber";

-- Reset everything
TRUNCATE TABLE "Participant";

-- Check who's available (not selected yet)
SELECT "serialNumber", "name"
FROM "Participant"
WHERE "serialNumber" NOT IN (
  SELECT "selectedNumber"
  FROM "Participant"
  WHERE "selectedNumber" IS NOT NULL
);
```

## Files You'll Edit Most

- `components/signup-form.tsx` - UI and form logic
- `app/actions.ts` - Server-side logic
- `prisma/contract.prisma` - Database schema
- `app/page.tsx` - Home page layout

## URLs

- Signup: http://localhost:3000/
- Check assignment: http://localhost:3000/check-assignment
- Admin: http://localhost:3000/admin
