# Build Fixes Applied

## Issues Fixed

### 1. TypeScript Error in `check-assignment-form.tsx`

**Error:**
```
Type '{ name: string; ... } | undefined' is not assignable to type '{ name: string; ... }'
```

**Fix Applied:**
Added type guard in the handleSubmit function to properly check the response type:

```typescript
if (response.success && 'participant' in response) {
  setResult({
    participant: response.participant,
    assignedTo: response.assignedTo || null,
    message: response.message,
  });
} else if (!response.success && 'error' in response) {
  setError(response.error);
}
```

### 2. TypeScript Error in `app/actions.ts`

**Error:**
Implicit return type was causing type inference issues.

**Fix Applied:**
Added explicit return type to `checkAssignment` function:

```typescript
export async function checkAssignment(phoneNumber: string): Promise<
  | {
      success: true;
      participant: { ... };
      assignedTo: { ... } | null;
      message?: string;
    }
  | { success: false; error: string }
>
```

### 3. Scripts Error in `init-db.ts`

**Error:**
```
Property 'contract' is missing in type '{ url: string; }'
Type 'PostgresClient<...>' has no call signatures.
```

**Fix Applied:**
The hand-written scripts all connected with a `postgres(...)` form this Prisma version rejects (`Cannot destructure property 'storage' of 'contract' as it is undefined`). They have since been removed in favour of the Prisma CLI:

| Task | Command |
| --- | --- |
| Bootstrap a new database from the contract | `pnpm db:init` |
| Reconcile an existing database with the contract | `pnpm db:update` |

## How to Build

The build process should now work without TypeScript errors:

```bash
# Clean build
rm -rf .next
pnpm build
```

## Alternative: Use Dev Server

If build still hangs, you can use the dev server which compiles on-demand:

```bash
pnpm dev
```

The dev server should start successfully and compile pages as you visit them.

## Files Modified

1. ✅ `components/check-assignment-form.tsx` - Fixed type guards
2. ✅ `app/actions.ts` - Added explicit return type
3. ✅ `scripts/init-db.ts` - Deleted; the replacement `.mjs` scripts were later removed too (use `pnpm db:init` / `pnpm db:update`)

## Testing

Once the server is running, test these pages:

1. **Signup:** http://localhost:3000/ (the signup form is the home page)
2. **Check Assignment:** http://localhost:3000/check-assignment
3. **Admin:** http://localhost:3000/admin

All TypeScript errors should be resolved.
