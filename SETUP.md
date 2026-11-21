# Wrapped in Joy - Gift Exchange Setup

## Overview

This is a simple Christmas gift exchange signup application where participants can:
1. Register with their name and phone/WhatsApp number
2. Select which participant they will gift to (by serial number)
3. View available participants in real-time

## Special Logic

- **First Participant**: The first person to sign up doesn't need to select anyone. They will be automatically assigned to gift to the second participant when they sign up.
- **Real-time Updates**: The available numbers update every 5 seconds so participants can see who's still available to be selected.
- **One-to-One Matching**: Each participant can only be selected once, ensuring everyone gets exactly one gift.

## Setup Instructions

### 1. Database Setup

You need a PostgreSQL 15+ database. The connection string is already configured in `.env`:

```env
DATABASE_URL="postgres://..."
```

### 2. Create the Database Table

Run this SQL in your PostgreSQL database:

```sql
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
```

Or connect to your database via command line:

```bash
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS \"Participant\" (
  \"id\" TEXT PRIMARY KEY,
  \"name\" TEXT NOT NULL,
  \"phoneNumber\" TEXT NOT NULL,
  \"serialNumber\" INTEGER NOT NULL UNIQUE,
  \"selectedNumber\" INTEGER UNIQUE,
  \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \"updatedAt\" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS \"Participant_serialNumber_idx\" ON \"Participant\"(\"serialNumber\");
CREATE INDEX IF NOT EXISTS \"Participant_selectedNumber_idx\" ON \"Participant\"(\"selectedNumber\");
"
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Generate Prisma Contract

The Prisma contract should auto-generate when you run the dev server, but you can also run:

```bash
pnpm contract:emit
```

### 5. Start the Development Server

```bash
pnpm dev
```

Then open http://localhost:3000/signup to access the signup form.

## How It Works

### Database Schema

- `id`: Unique identifier (UUID)
- `name`: Participant's name
- `phoneNumber`: Phone/WhatsApp number
- `serialNumber`: Sequential number assigned when signing up (1, 2, 3, ...)
- `selectedNumber`: The serial number of the participant they will gift to (nullable for first participant)
- `createdAt`: Timestamp of registration
- `updatedAt`: Last update timestamp

### Server Actions

The app uses Next.js Server Actions for all database operations:

1. **`getAvailableNumbers()`**: Returns list of participants who haven't been selected yet
2. **`getParticipantCount()`**: Returns total number of participants
3. **`signupParticipant(name, phone, selectedNumber)`**: Creates a new participant
   - Validates inputs
   - Assigns sequential serial number
   - Handles first participant special case
   - Assigns first participant to second participant automatically

### UI Features

- Form shows available participants in a dropdown
- Real-time updates every 5 seconds
- Shows count of available participants
- Success message after registration
- Error handling for validation and database errors
- First participant sees a special message explaining they'll be auto-assigned

## Tech Stack

- **Next.js 16**: React framework with App Router
- **Prisma 8**: ORM with PostgreSQL driver
- **shadcn/ui**: UI components (built on Base UI)
- **Tailwind CSS 4**: Styling
- **TypeScript**: Type safety

## Deployment

For production deployment:

1. Set up a PostgreSQL database (e.g., on Vercel Postgres, Supabase, or Railway)
2. Update `DATABASE_URL` in your environment variables
3. Run the table creation SQL
4. Deploy to Vercel or your preferred platform

```bash
pnpm build
pnpm start
```

## Troubleshooting

### Database Connection Issues

Make sure your `DATABASE_URL` in `.env` is correct and the database is accessible.

### Table Doesn't Exist

Run the SQL commands from step 2 above in your PostgreSQL database.

### Type Errors

If you see TypeScript errors, try:

```bash
pnpm contract:emit
```

This regenerates the Prisma types from the contract schema.
