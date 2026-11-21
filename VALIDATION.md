# Validation Implementation

## Backend Validation (Server Actions)

All validation happens in `app/actions.ts` in the `signupParticipant()` function.

### Name Validation

**Rules:**
- Required (cannot be empty or just whitespace)
- Minimum 2 characters
- Maximum 100 characters
- Only allows: letters (a-z, A-Z), spaces, hyphens (-), apostrophes ('), and periods (.)

**Error Messages:**
- "Name is required"
- "Name must be at least 2 characters long"
- "Name is too long (max 100 characters)"
- "Name can only contain letters, spaces, hyphens, and apostrophes"

**Valid Examples:**
- "John Doe"
- "Mary-Jane O'Connor"
- "Dr. Sarah Smith"
- "José María"

**Invalid Examples:**
- "J" (too short)
- "John123" (contains numbers)
- "John@Doe" (contains special characters)

### Phone Number Validation

**Rules:**
- Required (cannot be empty)
- After removing formatting characters (spaces, hyphens, parentheses, dots), must contain:
  - Optional + prefix
  - 10 to 15 digits only
- Supports international format with country code

**Formatting characters allowed (but stripped for validation):**
- Spaces: ` `
- Hyphens: `-`
- Parentheses: `(` `)`
- Dots: `.`

**Error Messages:**
- "Phone number is required"
- "Please enter a valid phone number (10-15 digits, optional + prefix)"

**Valid Examples:**
- "+234 803 123 4567"
- "+1 (555) 123-4567"
- "08031234567"
- "+44 20 7946 0958"
- "+234-803-123-4567"

**Invalid Examples:**
- "123456789" (too short, less than 10 digits)
- "phone number" (contains letters)
- "+234 803 abc defg" (contains non-digits)

### Selected Number Validation

**Rules:**
- First participant: Can be null (no selection required)
- All other participants: Must select a number
- Selected number must exist in the available numbers list
- Selected number must not already be taken by another participant

**Error Messages:**
- "Please select a number to gift to"
- "The selected number is no longer available"

## Frontend Validation (Client-Side)

Implemented in `components/signup-form.tsx` using HTML5 validation attributes.

### Name Input

```tsx
<Input
  type="text"
  required
  minLength={2}
  maxLength={100}
  pattern="[a-zA-Z\s\-'\.]+"
  title="Name can only contain letters, spaces, hyphens, and apostrophes"
/>
```

**Features:**
- Browser shows validation message before submission
- Provides immediate feedback on invalid characters
- Prevents form submission if invalid

### Phone Number Input

```tsx
<Input
  type="tel"
  required
  pattern="[\+]?[0-9\s\-\(\)\.]{10,20}"
  title="Please enter a valid phone number (10-15 digits)"
/>
```

**Features:**
- `type="tel"` triggers numeric keyboard on mobile devices
- Pattern allows common phone number formats
- Prevents submission with clearly invalid numbers

### Field Descriptions

Both fields now have helpful descriptions:
- Name: "At least 2 characters, letters only"
- Phone: "Include country code (e.g., +234)"

## Success Response

After successful registration, the user sees:

1. **Their serial number**: The unique number assigned to them
2. **Who they're gifting to** (if applicable):
   - Name
   - Serial number
   - Phone number

### Example Success Messages

**First Participant:**
```
🎉 Registration Successful!

Your serial number is: #1

You'll be gifting to the second participant who signs up!
```

**Subsequent Participants:**
```
🎉 Registration Successful!

Your serial number is: #3

You will be gifting to:
John Doe
Serial #1
+234 803 123 4567
```

## Validation Flow

```
User fills form
    ↓
Client-side validation (HTML5)
    ↓
Form submission
    ↓
Server-side validation (actions.ts)
    ↓
    ├─ Invalid → Error message returned
    │              ↓
    │         Display error in form
    │
    └─ Valid → Create participant
                  ↓
              Return success with details
                  ↓
              Show success message with:
              - Serial number
              - Selected participant info
```

## Error Handling

### Display
All errors are shown in a red alert box above the form:
```tsx
<div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
  {error}
</div>
```

### Types of Errors

1. **Validation Errors**: Name/phone format issues
2. **Business Logic Errors**: Selected number no longer available
3. **System Errors**: Database connection issues

### Error Recovery

- User can correct their input and resubmit
- Form fields retain their values (except after successful submission)
- Error message disappears when user resubmits

## Testing Validation

### Test Name Validation

```bash
# Test via browser console or API client
# Invalid cases:
- "A" → "Name must be at least 2 characters long"
- "John123" → "Name can only contain letters, spaces, hyphens, and apostrophes"
- "" → "Name is required"

# Valid cases:
- "John Doe" → Success
- "Mary-Jane O'Connor" → Success
```

### Test Phone Validation

```bash
# Invalid cases:
- "123" → "Please enter a valid phone number (10-15 digits, optional + prefix)"
- "abcdefghij" → "Please enter a valid phone number"
- "" → "Phone number is required"

# Valid cases:
- "+234 803 123 4567" → Success
- "08031234567" → Success
- "+1 555 123 4567" → Success
```

### Test Selected Number Validation

```bash
# Scenario 1: First participant
- selectedNumber: null → Success (no selection required)

# Scenario 2: Second participant
- selectedNumber: null → "Please select a number to gift to"
- selectedNumber: 1 → Success

# Scenario 3: Race condition
- Two users select same number
- First to submit → Success
- Second to submit → "The selected number is no longer available"
```

## Implementation Details

### Why Both Client and Server Validation?

**Client-side (HTML5):**
- ✅ Immediate feedback
- ✅ Better UX
- ✅ Reduces server load
- ❌ Can be bypassed
- ❌ Not sufficient for security

**Server-side (Node.js):**
- ✅ Secure and reliable
- ✅ Cannot be bypassed
- ✅ Consistent validation
- ✅ Business logic enforcement
- ❌ Slower feedback (requires round trip)

**Conclusion:** Use both for best UX and security

### Regex Patterns Explained

**Name Pattern:**
```regex
/^[a-zA-Z\s\-'\.]+$/
```
- `^` - Start of string
- `[a-zA-Z\s\-'\.]+` - One or more of:
  - `a-zA-Z` - Letters
  - `\s` - Spaces
  - `\-` - Hyphens
  - `'` - Apostrophes
  - `\.` - Periods
- `$` - End of string

**Phone Pattern (after cleaning):**
```regex
/^\+?[0-9]{10,15}$/
```
- `^` - Start of string
- `\+?` - Optional plus sign
- `[0-9]{10,15}` - 10 to 15 digits
- `$` - End of string

## Customization

### To Change Name Rules

Edit `app/actions.ts`:
```typescript
// Allow numbers in names
if (!/^[a-zA-Z0-9\s\-'\.]+$/.test(trimmedName)) {
  return { success: false, error: "..." };
}

// Change length limits
if (trimmedName.length < 3) { // minimum 3 instead of 2
  return { success: false, error: "Name must be at least 3 characters" };
}
```

### To Change Phone Rules

Edit `app/actions.ts`:
```typescript
// Require exactly 11 digits (Nigerian mobile)
if (!/^\+?234[0-9]{10}$/.test(cleanedPhone)) {
  return { 
    success: false, 
    error: "Please enter a valid Nigerian phone number (+234...)" 
  };
}

// Allow 8-20 digits instead of 10-15
if (!/^\+?[0-9]{8,20}$/.test(cleanedPhone)) {
  return { success: false, error: "..." };
}
```

### To Add More Validation

```typescript
// Check for duplicate phone numbers
const existingParticipant = await db.orm.public.Participant
  .where({ phoneNumber: trimmedPhone })
  .first();

if (existingParticipant) {
  return { 
    success: false, 
    error: "This phone number is already registered" 
  };
}
```

## Security Considerations

1. **XSS Prevention**: All user input is sanitized before display (React does this automatically)
2. **SQL Injection**: Prisma ORM uses parameterized queries
3. **Input Length Limits**: Prevents DOS attacks with extremely long strings
4. **Character Restrictions**: Reduces risk of code injection
5. **Server-side Validation**: Cannot be bypassed by malicious users

## Future Enhancements

Potential validation improvements:

1. **Email Validation**: Add optional email field
2. **Duplicate Detection**: Prevent same person registering twice
3. **Phone Formatting**: Auto-format as user types
4. **SMS Verification**: Confirm phone number is real
5. **Profanity Filter**: Block inappropriate names
6. **Real-time Validation**: Show errors as user types
7. **International Phone Support**: Use libphonenumber-js
