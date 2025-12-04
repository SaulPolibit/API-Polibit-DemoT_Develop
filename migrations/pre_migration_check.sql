-- Pre-Migration Verification Script
-- Run this script BEFORE executing merge_investor_to_user.sql
-- This ensures data integrity and identifies potential issues

-- ============================================================================
-- CHECK 1: Verify all tables exist
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking if all required tables exist...';
END $$;

SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✓ All tables exist'
    ELSE '✗ Missing tables: ' || (4 - COUNT(*))::text
  END AS status
FROM information_schema.tables
WHERE table_name IN ('structure_investors', 'capital_call_allocations', 'distribution_allocations', 'investment_subscriptions')
  AND table_schema = 'public';

-- ============================================================================
-- CHECK 2: Verify investor_id columns exist
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking if investor_id columns exist...';
END $$;

SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'investor_id' THEN '✓ Column exists'
    ELSE '✗ Column missing'
  END AS status
FROM information_schema.columns
WHERE table_name IN ('structure_investors', 'capital_call_allocations', 'distribution_allocations', 'investment_subscriptions')
  AND column_name = 'investor_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- CHECK 3: Check for orphaned investor_id references
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking for orphaned investor_id references...';
END $$;

-- Check structure_investors for orphaned records
SELECT
  'structure_investors' AS table_name,
  COUNT(*) AS orphaned_records
FROM structure_investors si
WHERE NOT EXISTS (
  SELECT 1 FROM investors i WHERE i.id = si.investor_id
);

-- Check capital_call_allocations for orphaned records
SELECT
  'capital_call_allocations' AS table_name,
  COUNT(*) AS orphaned_records
FROM capital_call_allocations cca
WHERE NOT EXISTS (
  SELECT 1 FROM investors i WHERE i.id = cca.investor_id
);

-- Check distribution_allocations for orphaned records
SELECT
  'distribution_allocations' AS table_name,
  COUNT(*) AS orphaned_records
FROM distribution_allocations da
WHERE NOT EXISTS (
  SELECT 1 FROM investors i WHERE i.id = da.investor_id
);

-- Check investment_subscriptions for orphaned records
SELECT
  'investment_subscriptions' AS table_name,
  COUNT(*) AS orphaned_records
FROM investment_subscriptions is_sub
WHERE NOT EXISTS (
  SELECT 1 FROM investors i WHERE i.id = is_sub.investor_id
);

-- ============================================================================
-- CHECK 4: Verify investor-user mapping exists
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking if all investors have corresponding user records...';
END $$;

-- Check if investors exist in users table (matched by email)
SELECT
  'Investors with matching users' AS check_type,
  COUNT(*) AS count
FROM investors inv
INNER JOIN users u ON u.email = inv.email;

SELECT
  'Investors WITHOUT matching users' AS check_type,
  COUNT(*) AS count
FROM investors inv
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = inv.email
);

-- List investors without matching users (if any)
SELECT
  inv.id AS investor_id,
  inv.email,
  inv.investor_type,
  'No matching user found' AS issue
FROM investors inv
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = inv.email
);

-- ============================================================================
-- CHECK 5: Count records in each table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Counting records that will be affected...';
END $$;

SELECT 'structure_investors' AS table_name, COUNT(*) AS record_count
FROM structure_investors
UNION ALL
SELECT 'capital_call_allocations', COUNT(*)
FROM capital_call_allocations
UNION ALL
SELECT 'distribution_allocations', COUNT(*)
FROM distribution_allocations
UNION ALL
SELECT 'investment_subscriptions', COUNT(*)
FROM investment_subscriptions;

-- ============================================================================
-- CHECK 6: Verify foreign key constraints
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking current foreign key constraints...';
END $$;

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('structure_investors', 'capital_call_allocations', 'distribution_allocations', 'investment_subscriptions')
  AND kcu.column_name = 'investor_id'
ORDER BY tc.table_name;

-- ============================================================================
-- CHECK 7: Verify users table has investor role records
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking users with investor role...';
END $$;

SELECT
  'Users with investor role' AS check_type,
  COUNT(*) AS count
FROM users
WHERE role = 3; -- 3 = INVESTOR role

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  orphaned_count INTEGER;
  missing_users INTEGER;
BEGIN
  -- Count orphaned records
  SELECT COUNT(*) INTO orphaned_count
  FROM (
    SELECT investor_id FROM structure_investors
    WHERE NOT EXISTS (SELECT 1 FROM investors i WHERE i.id = structure_investors.investor_id)
    UNION ALL
    SELECT investor_id FROM capital_call_allocations
    WHERE NOT EXISTS (SELECT 1 FROM investors i WHERE i.id = capital_call_allocations.investor_id)
    UNION ALL
    SELECT investor_id FROM distribution_allocations
    WHERE NOT EXISTS (SELECT 1 FROM investors i WHERE i.id = distribution_allocations.investor_id)
    UNION ALL
    SELECT investor_id FROM investment_subscriptions
    WHERE NOT EXISTS (SELECT 1 FROM investors i WHERE i.id = investment_subscriptions.investor_id)
  ) orphaned;

  -- Count investors without users
  SELECT COUNT(*) INTO missing_users
  FROM investors inv
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = inv.email);

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'PRE-MIGRATION CHECK SUMMARY';
  RAISE NOTICE '============================================================';

  IF orphaned_count = 0 THEN
    RAISE NOTICE '✓ No orphaned investor_id records found';
  ELSE
    RAISE WARNING '✗ Found % orphaned investor_id records - MUST BE FIXED BEFORE MIGRATION', orphaned_count;
  END IF;

  IF missing_users = 0 THEN
    RAISE NOTICE '✓ All investors have corresponding user records';
  ELSE
    RAISE WARNING '✗ Found % investors without user records - MUST BE FIXED BEFORE MIGRATION', missing_users;
  END IF;

  IF orphaned_count = 0 AND missing_users = 0 THEN
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✓ MIGRATION CAN PROCEED SAFELY';
    RAISE NOTICE '============================================================';
  ELSE
    RAISE NOTICE '============================================================';
    RAISE WARNING '✗ MIGRATION CANNOT PROCEED - FIX ISSUES ABOVE FIRST';
    RAISE NOTICE '============================================================';
  END IF;
END $$;
