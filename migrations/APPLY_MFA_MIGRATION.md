# Apply MFA Factor ID Migration

This guide explains how to add the `mfa_factor_id` column to the `users` table in Supabase.

## What This Migration Does

Adds a new column `mfa_factor_id` to the `users` table to store the Supabase MFA factor ID when users enroll in Multi-Factor Authentication.

## Steps to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sredvfzqtzbjmobijjtw`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the following SQL:

```sql
-- Add mfa_factor_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mfa_factor_id TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.mfa_factor_id IS 'Supabase MFA factor ID for users enrolled in Multi-Factor Authentication';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_mfa_factor_id ON users(mfa_factor_id) WHERE mfa_factor_id IS NOT NULL;
```

6. Click **Run** or press `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
7. You should see: "Success. No rows returned"

### Option 2: Using Migration File

1. Navigate to the migrations folder:
```bash
cd migrations
```

2. Run the migration using Supabase CLI (if you have it installed):
```bash
supabase db push add_mfa_factor_id_to_users.sql
```

OR manually copy the contents of `add_mfa_factor_id_to_users.sql` and run it in Supabase SQL Editor.

## Verify the Migration

After running the migration, verify it was successful:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'mfa_factor_id';
```

**Expected Result:**
```
column_name    | data_type | is_nullable
---------------|-----------|------------
mfa_factor_id  | text      | YES
```

## Test the Feature

After migration, test MFA enrollment:

1. Login to get tokens:
```bash
curl -X POST http://localhost:3005/api/custom/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourPassword"
  }'
```

2. Enroll in MFA:
```bash
curl -X POST http://localhost:3005/api/custom/mfa/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseAccessToken": "YOUR_SUPABASE_ACCESS_TOKEN",
    "supabaseRefreshToken": "YOUR_SUPABASE_REFRESH_TOKEN",
    "factorType": "totp",
    "friendlyName": "Test Phone"
  }'
```

3. Check if `mfaFactorId` was saved:
```sql
SELECT id, email, mfa_factor_id
FROM users
WHERE email = 'your@email.com';
```

You should see the `mfa_factor_id` populated with a UUID value.

## Rollback (If Needed)

If you need to remove the column:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS mfa_factor_id;
DROP INDEX IF EXISTS idx_users_mfa_factor_id;
```

⚠️ **Warning:** This will permanently delete all MFA factor IDs from the users table.

## What Changed in the Code

### 1. User Model (`src/models/supabase/user.js`)
- Added `mfaFactorId` to `_toModel()` method
- Added `mfaFactorId: 'mfa_factor_id'` to `_toDbFields()` method

### 2. MFA Enroll Endpoint (`src/routes/custom.routes.js`)
- Added code to save `mfaFactorId` to user after successful enrollment:
  ```javascript
  await User.findByIdAndUpdate(userId, {
    mfaFactorId: data.id
  });
  ```

### 3. MFA Unenroll Endpoint (`src/routes/custom.routes.js`)
- Added code to clear `mfaFactorId` from user after unenrollment:
  ```javascript
  await User.findByIdAndUpdate(userId, {
    mfaFactorId: null
  });
  ```

## Benefits

- Quick lookup of user's MFA factor ID without querying `mfa_factors` table
- Easy to check if user has MFA enabled: `WHERE mfa_factor_id IS NOT NULL`
- Improves performance for MFA-related operations
- Indexed for fast queries

---

**Migration Created:** December 24, 2025
**Status:** Ready to apply
