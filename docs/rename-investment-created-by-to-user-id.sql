-- Migration: Rename created_by to user_id in investments table
-- Description: Changes created_by column to user_id to reflect that it stores the investor/owner
-- Run this in Supabase SQL Editor

-- Rename the column
ALTER TABLE public.investments
RENAME COLUMN created_by TO user_id;

-- Update the comment for documentation
COMMENT ON COLUMN public.investments.user_id IS 'User ID of the investor/owner of this investment';

-- Verify the column was renamed
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'investments'
  AND column_name = 'user_id';
