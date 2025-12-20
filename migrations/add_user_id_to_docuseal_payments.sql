-- Add user_id column to docuseal_submissions and payments tables
-- This field will store the user ID who created the row

-- Step 1: Add user_id column to docuseal_submissions table
ALTER TABLE docuseal_submissions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_docuseal_submissions_user_id ON docuseal_submissions(user_id);

-- Step 3: Add comment to document the column
COMMENT ON COLUMN docuseal_submissions.user_id IS 'ID of the user who created this submission';

-- Step 4: Add user_id column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 5: Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Step 6: Add comment to document the column
COMMENT ON COLUMN payments.user_id IS 'ID of the user who created this payment';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Added user_id columns successfully';
    RAISE NOTICE '📋 Tables updated:';
    RAISE NOTICE '   - docuseal_submissions.user_id';
    RAISE NOTICE '   - payments.user_id';
    RAISE NOTICE '🔗 Foreign key references users(id)';
    RAISE NOTICE '📊 Indexes created for performance';
    RAISE NOTICE '================================================';
END $$;
