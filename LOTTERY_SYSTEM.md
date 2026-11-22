# Lottery-Style Gift Exchange System 🎰

## Overview

Implemented a **lottery-style draft system** where participants register without selecting anyone, and assignments are made randomly after the deadline.

## What Changed

### ✅ Removed Manual Selection
- No more "Who will you gift to?" dropdown
- Participants just register with: Name, Phone, Location
- Much simpler signup process!

### ✅ Added Countdown Timer
- Flip-clock style countdown to **November 25th midnight**
- Shows: Days : Hours : Minutes : Seconds
- Automatically shows "Registration Closed" after deadline

### ✅ Added Participant Counter
- Real-time count of registered participants
- Updates every 5 seconds
- Displayed prominently on signup page

### ✅ Lottery Draw System
- Admin runs lottery after deadline
- Randomly assigns all participants using Fisher-Yates shuffle
- Creates a complete loop (everyone gifts to someone)
- Ensures no one is assigned to themselves

## User Flow

### Before Deadline (Signup Phase)

**Participant Experience:**
1. Visit `/signup`
2. See countdown timer and participant count
3. Enter: Name, Phone (+234 auto-prefix), Location
4. Submit
5. Receive serial number
6. Told assignment will be revealed after November 25th

**What They See:**
```
Silent Night, Secret Gifts
Join the gift exchange lottery

[12 participants registered]

[Countdown: 5 Days : 12 Hours : 30 Mins : 15 Secs]

[Name field]
[Phone field with +234 prefix]
[Location field]
[Submit button]
```

### After Deadline (Assignment Phase)

**Admin:**
1. Visit `/admin`
2. Click "🎲 Run Lottery Draw"
3. System randomly assigns everyone
4. See complete list of assignments

**Participants:**
1. Visit `/check-assignment`
2. Enter their phone number
3. See who they're gifting to (name, location, phone)

## Technical Details

### Lottery Algorithm

```typescript
1. Get all participants
2. Create array of all serial numbers
3. Shuffle using Fisher-Yates algorithm
4. Assign each participant to next in shuffled array
5. Check no one assigned to themselves (swap if needed)
6. Save all assignments to database
```

### Why This Works Better

**Before (Manual Selection):**
- ❌ Complex dropdown with 100 numbers
- ❌ Race conditions (two people select same number)
- ❌ Unregistered numbers causing issues
- ❌ First/second participant edge cases
- ❌ Required reassignment logic

**After (Lottery):**
- ✅ Simple 3-field form
- ✅ No race conditions
- ✅ No edge cases
- ✅ Fair and random
- ✅ Everyone guaranteed a match

## Files Modified

### New Files
- `components/countdown-timer.tsx` - Flip clock countdown
- `components/signup-form.tsx` - Simplified form (removed dropdown)
- `components/admin-panel.tsx` - Updated for lottery

### Updated Files
- `app/actions.ts` - Added `runLotteryDraw()` function

### Removed
- Manual number selection logic
- Available numbers loading
- Complex validation for selections

## Admin Panel

**Location:** `/admin`

**Features:**
- Run Lottery Draw button
- Confirmation dialog
- Success/error display
- Complete assignment list
- How it works guide

**When to Use:**
- After November 25th midnight
- When all expected participants have registered
- Can be run multiple times (reassigns everyone)

## Countdown Timer Features

**Displays:**
- Days remaining
- Hours
- Minutes  
- Seconds
- Target date: "Midnight, November 25th, 2024"

**After Deadline:**
- Shows "🔒 Registration Closed"
- Form still accessible (for testing)
- Admin can still run lottery

## Participant Count

**Updates:**
- Every 5 seconds automatically
- After each successful registration
- Shows total registered count
- Format: "12 participants registered"

## API Endpoints (Server Actions)

### `signupParticipant(name, phone, location, null)`
- `null` for selectedNumber (no manual selection)
- Creates participant with auto-incremented serial number
- Returns serial number to user

### `runLotteryDraw()`
- Admin only
- Randomly assigns all participants
- Returns complete assignment list
- Updates all `selectedNumber` fields in database

### `checkAssignment(phoneNumber)`
- Available after lottery is run
- Shows who the participant is gifting to
- Before lottery: "Assignment pending"

## Database

**Schema unchanged:**
```sql
CREATE TABLE "Participant" (
  "selectedNumber" INTEGER,  -- NULL until lottery is run
  ...
);
```

**Before Lottery:**
- All `selectedNumber` values are `NULL`

**After Lottery:**
- All `selectedNumber` values are assigned
- Forms a complete gift exchange loop

## Testing

### Test Signup Flow
1. Start dev server: `pnpm dev`
2. Visit `/signup`
3. Verify countdown shows correct time to Nov 25
4. Verify participant count shows
5. Register a test participant
6. Verify count increments

### Test Lottery Draw
1. Register 5+ test participants
2. Visit `/admin`
3. Click "Run Lottery Draw"
4. Verify all participants assigned
5. Check `/check-assignment` with test phone numbers
6. Verify assignments displayed correctly

## Deployment Checklist

- [ ] Verify countdown shows correct timezone
- [ ] Test lottery with production data
- [ ] Share `/signup` link with participants
- [ ] Monitor participant count
- [ ] Run lottery after deadline
- [ ] Notify participants assignments are ready
- [ ] Share `/check-assignment` link

## Future Enhancements

1. **Email Notifications**
   - Send assignment email after lottery
   - Include recipient details

2. **SMS Notifications**
   - Text participants when lottery is run
   - Include link to check assignment

3. **WhatsApp Integration**
   - Auto-send WhatsApp message with assignment

4. **Schedule Lottery**
   - Auto-run at midnight on November 25th
   - No manual admin action needed

5. **Export Results**
   - Download CSV of all assignments
   - For record keeping

## Summary

The lottery system is **much simpler, fairer, and more reliable** than manual selection. Participants just sign up, wait for the deadline, then check who they're matched with. Perfect for your use case!

🎉 Everything is ready to go!
