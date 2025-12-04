-- Fix Orphaned Records Script
-- This script identifies and fixes orphaned investor_id references
-- Run this if merge_investor_to_user.sql fails with foreign key constraint errors

-- ============================================================================
-- STEP 1: Identify orphaned records
-- ============================================================================

-- Show all orphaned investor_id values across all tables
SELECT DISTINCT
  si.investor_id,
  'structure_investors' as found_in_table,
  (SELECT email FROM investors WHERE id = si.investor_id) as investor_email,
  (SELECT investor_type FROM investors WHERE id = si.investor_id) as investor_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE id = si.investor_id) THEN 'ID exists in users'
    WHEN EXISTS (SELECT 1 FROM investors i JOIN users u ON i.email = u.email WHERE i.id = si.investor_id) THEN 'Email match found in users'
    ELSE 'No match in users'
  END as status
FROM structure_investors si
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = si.investor_id)

UNION

SELECT DISTINCT
  cca.investor_id,
  'capital_call_allocations',
  (SELECT email FROM investors WHERE id = cca.investor_id),
  (SELECT investor_type FROM investors WHERE id = cca.investor_id),
  CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE id = cca.investor_id) THEN 'ID exists in users'
    WHEN EXISTS (SELECT 1 FROM investors i JOIN users u ON i.email = u.email WHERE i.id = cca.investor_id) THEN 'Email match found in users'
    ELSE 'No match in users'
  END
FROM capital_call_allocations cca
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cca.investor_id)

UNION

SELECT DISTINCT
  da.investor_id,
  'distribution_allocations',
  (SELECT email FROM investors WHERE id = da.investor_id),
  (SELECT investor_type FROM investors WHERE id = da.investor_id),
  CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE id = da.investor_id) THEN 'ID exists in users'
    WHEN EXISTS (SELECT 1 FROM investors i JOIN users u ON i.email = u.email WHERE i.id = da.investor_id) THEN 'Email match found in users'
    ELSE 'No match in users'
  END
FROM distribution_allocations da
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = da.investor_id)

UNION

SELECT DISTINCT
  is_sub.investor_id,
  'investment_subscriptions',
  (SELECT email FROM investors WHERE id = is_sub.investor_id),
  (SELECT investor_type FROM investors WHERE id = is_sub.investor_id),
  CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE id = is_sub.investor_id) THEN 'ID exists in users'
    WHEN EXISTS (SELECT 1 FROM investors i JOIN users u ON i.email = u.email WHERE i.id = is_sub.investor_id) THEN 'Email match found in users'
    ELSE 'No match in users'
  END
FROM investment_subscriptions is_sub
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = is_sub.investor_id)
ORDER BY investor_id;

-- ============================================================================
-- STEP 2: Create users for missing investors
-- ============================================================================

-- This will create user records for any investor that doesn't exist in users table
-- It preserves the same ID from the investors table
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  is_email_verified,
  app_language,
  investor_type,
  phone_number,
  country,
  tax_id,
  kyc_status,
  accredited_investor,
  risk_tolerance,
  investment_preferences,
  full_name,
  date_of_birth,
  nationality,
  passport_number,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  institution_name,
  institution_type,
  registration_number,
  legal_representative,
  fund_name,
  fund_manager,
  aum,
  office_name,
  family_name,
  principal_contact,
  assets_under_management
)
SELECT DISTINCT ON (i.id)
  i.id,
  i.email,
  COALESCE(NULLIF(SPLIT_PART(i.full_name, ' ', 1), ''), SPLIT_PART(i.institution_name, ' ', 1), SPLIT_PART(i.fund_name, ' ', 1), SPLIT_PART(i.office_name, ' ', 1), 'Investor'),
  COALESCE(NULLIF(SPLIT_PART(i.full_name, ' ', 2), ''), ''),
  3, -- INVESTOR role
  true,
  false,
  'en',
  i.investor_type,
  i.phone_number,
  i.country,
  i.tax_id,
  i.kyc_status,
  i.accredited_investor,
  i.risk_tolerance,
  i.investment_preferences,
  i.full_name,
  i.date_of_birth,
  i.nationality,
  i.passport_number,
  i.address_line1,
  i.address_line2,
  i.city,
  i.state,
  i.postal_code,
  i.institution_name,
  i.institution_type,
  i.registration_number,
  i.legal_representative,
  i.fund_name,
  i.fund_manager,
  i.aum,
  i.office_name,
  i.family_name,
  i.principal_contact,
  i.assets_under_management
FROM investors i
WHERE i.id IN (
  -- Get all unique orphaned investor_ids
  SELECT DISTINCT investor_id FROM structure_investors
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = structure_investors.investor_id)
  UNION
  SELECT DISTINCT investor_id FROM capital_call_allocations
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = capital_call_allocations.investor_id)
  UNION
  SELECT DISTINCT investor_id FROM distribution_allocations
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = distribution_allocations.investor_id)
  UNION
  SELECT DISTINCT investor_id FROM investment_subscriptions
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = investment_subscriptions.investor_id)
)
ON CONFLICT (id) DO UPDATE SET
  investor_type = EXCLUDED.investor_type,
  phone_number = COALESCE(users.phone_number, EXCLUDED.phone_number),
  country = COALESCE(users.country, EXCLUDED.country),
  tax_id = EXCLUDED.tax_id,
  kyc_status = COALESCE(users.kyc_status, EXCLUDED.kyc_status),
  accredited_investor = EXCLUDED.accredited_investor,
  risk_tolerance = EXCLUDED.risk_tolerance,
  investment_preferences = EXCLUDED.investment_preferences,
  full_name = COALESCE(users.full_name, EXCLUDED.full_name),
  date_of_birth = EXCLUDED.date_of_birth,
  nationality = EXCLUDED.nationality,
  passport_number = EXCLUDED.passport_number,
  address_line1 = COALESCE(users.address_line1, EXCLUDED.address_line1),
  address_line2 = COALESCE(users.address_line2, EXCLUDED.address_line2),
  city = COALESCE(users.city, EXCLUDED.city),
  state = COALESCE(users.state, EXCLUDED.state),
  postal_code = COALESCE(users.postal_code, EXCLUDED.postal_code),
  institution_name = EXCLUDED.institution_name,
  institution_type = EXCLUDED.institution_type,
  registration_number = EXCLUDED.registration_number,
  legal_representative = EXCLUDED.legal_representative,
  fund_name = EXCLUDED.fund_name,
  fund_manager = EXCLUDED.fund_manager,
  aum = EXCLUDED.aum,
  office_name = EXCLUDED.office_name,
  family_name = EXCLUDED.family_name,
  principal_contact = EXCLUDED.principal_contact,
  assets_under_management = EXCLUDED.assets_under_management;

-- ============================================================================
-- STEP 3: Verify fix
-- ============================================================================

-- Check if all orphaned records are now resolved
SELECT
  'After Fix - Orphaned Records Check' as check_name,
  'structure_investors' as table_name,
  COUNT(*) as orphaned_count
FROM structure_investors si
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = si.investor_id)

UNION ALL

SELECT
  'After Fix - Orphaned Records Check',
  'capital_call_allocations',
  COUNT(*)
FROM capital_call_allocations cca
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cca.investor_id)

UNION ALL

SELECT
  'After Fix - Orphaned Records Check',
  'distribution_allocations',
  COUNT(*)
FROM distribution_allocations da
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = da.investor_id)

UNION ALL

SELECT
  'After Fix - Orphaned Records Check',
  'investment_subscriptions',
  COUNT(*)
FROM investment_subscriptions is_sub
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = is_sub.investor_id);

-- ============================================================================
-- STEP 4: Summary
-- ============================================================================

DO $$
DECLARE
  remaining_orphaned INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_orphaned
  FROM (
    SELECT investor_id FROM structure_investors
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = structure_investors.investor_id)
    UNION
    SELECT investor_id FROM capital_call_allocations
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = capital_call_allocations.investor_id)
    UNION
    SELECT investor_id FROM distribution_allocations
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = distribution_allocations.investor_id)
    UNION
    SELECT investor_id FROM investment_subscriptions
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = investment_subscriptions.investor_id)
  ) orphaned;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ORPHANED RECORDS FIX SUMMARY';
  RAISE NOTICE '============================================================';

  IF remaining_orphaned = 0 THEN
    RAISE NOTICE '✓ All orphaned records have been fixed!';
    RAISE NOTICE '✓ All investor_id values now exist in users table';
    RAISE NOTICE '✓ You can now run merge_investor_to_user.sql';
  ELSE
    RAISE WARNING '✗ Still have % orphaned investor_id values', remaining_orphaned;
    RAISE NOTICE 'Review the verification query above for details';
  END IF;

  RAISE NOTICE '============================================================';
END $$;
