-- Migration: Add MFA Factor ID to Users Table
-- Description: Adds mfa_factor_id column to store the Supabase MFA factor ID for enrolled users
-- Date: 2025-12-24

-- Add mfa_factor_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mfa_factor_id TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.mfa_factor_id IS 'Supabase MFA factor ID for users enrolled in Multi-Factor Authentication';

-- Optional: Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_users_mfa_factor_id ON users(mfa_factor_id) WHERE mfa_factor_id IS NOT NULL;

-- Rollback command (if needed):
-- ALTER TABLE users DROP COLUMN IF EXISTS mfa_factor_id;
-- DROP INDEX IF EXISTS idx_users_mfa_factor_id;
