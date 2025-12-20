-- Migration: Add Visibility Type Field to Investments
-- This migration adds a visibility_type column to control investment visibility
-- (e.g., PUBLIC, PRIVATE, RESTRICTED)

-- ============================================================================
-- Add Visibility Type Field
-- ============================================================================

-- Add visibility_type column if missing
ALTER TABLE investments
ADD COLUMN IF NOT EXISTS visibility_type VARCHAR(50) DEFAULT 'public';

-- Add comment to column
COMMENT ON COLUMN investments.visibility_type IS 'Controls investment visibility: public | fund-specific | private';

-- ============================================================================
-- Create Index for Better Query Performance
-- ============================================================================

-- Create index on visibility_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_investments_visibility_type ON investments(visibility_type);

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify the column was added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'investments'
AND column_name = 'visibility_type';
