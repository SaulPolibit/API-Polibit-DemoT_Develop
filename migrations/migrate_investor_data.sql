-- Data Migration: Migrate Investor Data to Users Table
-- This script handles the data migration from investors table to users table
-- Run this BEFORE merge_investor_to_user.sql

-- ============================================================================
-- STEP 1: Check current state
-- ============================================================================

-- Find investors that exist but don't have corresponding users
SELECT
  i.id as investor_id,
  i.email,
  i.investor_type,
  'Missing in users table' as issue
FROM investors i
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = i.email
)
ORDER BY i.email;

-- ============================================================================
-- STEP 2: Migrate investor records to users table
-- ============================================================================

-- Insert investor records into users table (only if they don't exist)
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  is_email_verified,
  app_language,
  -- Investor fields
  investor_type,
  phone_number,
  country,
  tax_id,
  kyc_status,
  accredited_investor,
  risk_tolerance,
  investment_preferences,
  -- Individual fields
  full_name,
  date_of_birth,
  nationality,
  passport_number,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  -- Institution fields
  institution_name,
  institution_type,
  registration_number,
  legal_representative,
  -- Fund of Funds fields
  fund_name,
  fund_manager,
  aum,
  -- Family Office fields
  office_name,
  family_name,
  principal_contact,
  assets_under_management,
  created_at,
  updated_at
)
SELECT
  i.id,
  i.email,
  COALESCE(SPLIT_PART(i.full_name, ' ', 1), ''), -- first_name from full_name
  COALESCE(SPLIT_PART(i.full_name, ' ', 2), ''), -- last_name from full_name
  3 as role, -- 3 = INVESTOR role
  true as is_active,
  false as is_email_verified,
  'en' as app_language,
  -- Investor fields
  i.investor_type,
  i.phone_number,
  i.country,
  i.tax_id,
  i.kyc_status,
  i.accredited_investor,
  i.risk_tolerance,
  i.investment_preferences,
  -- Individual fields
  i.full_name,
  i.date_of_birth,
  i.nationality,
  i.passport_number,
  i.address_line1,
  i.address_line2,
  i.city,
  i.state,
  i.postal_code,
  -- Institution fields
  i.institution_name,
  i.institution_type,
  i.registration_number,
  i.legal_representative,
  -- Fund of Funds fields
  i.fund_name,
  i.fund_manager,
  i.aum,
  -- Family Office fields
  i.office_name,
  i.family_name,
  i.principal_contact,
  i.assets_under_management,
  i.created_at,
  i.updated_at
FROM investors i
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = i.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Update existing user records with investor data
-- ============================================================================

-- Update users who have matching email but missing investor data
UPDATE users u
SET
  investor_type = i.investor_type,
  phone_number = COALESCE(u.phone_number, i.phone_number),
  country = COALESCE(u.country, i.country),
  tax_id = i.tax_id,
  kyc_status = COALESCE(u.kyc_status, i.kyc_status),
  accredited_investor = i.accredited_investor,
  risk_tolerance = i.risk_tolerance,
  investment_preferences = i.investment_preferences,
  -- Individual fields
  full_name = COALESCE(u.full_name, i.full_name),
  date_of_birth = i.date_of_birth,
  nationality = i.nationality,
  passport_number = i.passport_number,
  address_line1 = COALESCE(u.address_line1, i.address_line1),
  address_line2 = COALESCE(u.address_line2, i.address_line2),
  city = COALESCE(u.city, i.city),
  state = COALESCE(u.state, i.state),
  postal_code = COALESCE(u.postal_code, i.postal_code),
  -- Institution fields
  institution_name = i.institution_name,
  institution_type = i.institution_type,
  registration_number = i.registration_number,
  legal_representative = i.legal_representative,
  -- Fund of Funds fields
  fund_name = i.fund_name,
  fund_manager = i.fund_manager,
  aum = i.aum,
  -- Family Office fields
  office_name = i.office_name,
  family_name = i.family_name,
  principal_contact = i.principal_contact,
  assets_under_management = i.assets_under_management
FROM investors i
WHERE u.email = i.email
  AND u.id != i.id
  AND u.investor_type IS NULL;

-- ============================================================================
-- STEP 4: Map investor_id to user_id in related tables
-- ============================================================================

-- Create a temporary mapping table
CREATE TEMP TABLE investor_user_mapping AS
SELECT
  i.id as investor_id,
  COALESCE(
    (SELECT id FROM users WHERE id = i.id),
    (SELECT id FROM users WHERE email = i.email LIMIT 1)
  ) as user_id
FROM investors i;

-- Update structure_investors
UPDATE structure_investors si
SET investor_id = mapping.user_id
FROM investor_user_mapping mapping
WHERE si.investor_id = mapping.investor_id
  AND mapping.user_id IS NOT NULL
  AND si.investor_id != mapping.user_id;

-- Update capital_call_allocations
UPDATE capital_call_allocations cca
SET investor_id = mapping.user_id
FROM investor_user_mapping mapping
WHERE cca.investor_id = mapping.investor_id
  AND mapping.user_id IS NOT NULL
  AND cca.investor_id != mapping.user_id;

-- Update distribution_allocations
UPDATE distribution_allocations da
SET investor_id = mapping.user_id
FROM investor_user_mapping mapping
WHERE da.investor_id = mapping.investor_id
  AND mapping.user_id IS NOT NULL
  AND da.investor_id != mapping.user_id;

-- Update investment_subscriptions
UPDATE investment_subscriptions is_sub
SET investor_id = mapping.user_id
FROM investor_user_mapping mapping
WHERE is_sub.investor_id = mapping.investor_id
  AND mapping.user_id IS NOT NULL
  AND is_sub.investor_id != mapping.user_id;

-- ============================================================================
-- STEP 5: Verify data integrity
-- ============================================================================

-- Check for any remaining orphaned records in structure_investors
SELECT
  'structure_investors' as table_name,
  COUNT(*) as orphaned_count
FROM structure_investors si
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = si.investor_id
);

-- Check for any remaining orphaned records in capital_call_allocations
SELECT
  'capital_call_allocations' as table_name,
  COUNT(*) as orphaned_count
FROM capital_call_allocations cca
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = cca.investor_id
);

-- Check for any remaining orphaned records in distribution_allocations
SELECT
  'distribution_allocations' as table_name,
  COUNT(*) as orphaned_count
FROM distribution_allocations da
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = da.investor_id
);

-- Check for any remaining orphaned records in investment_subscriptions
SELECT
  'investment_subscriptions' as table_name,
  COUNT(*) as orphaned_count
FROM investment_subscriptions is_sub
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = is_sub.investor_id
);

-- ============================================================================
-- STEP 6: Report summary
-- ============================================================================

DO $$
DECLARE
  total_orphaned INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(orphaned), 0) INTO total_orphaned
  FROM (
    SELECT COUNT(*) as orphaned FROM structure_investors si
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = si.investor_id)
    UNION ALL
    SELECT COUNT(*) FROM capital_call_allocations cca
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cca.investor_id)
    UNION ALL
    SELECT COUNT(*) FROM distribution_allocations da
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = da.investor_id)
    UNION ALL
    SELECT COUNT(*) FROM investment_subscriptions is_sub
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = is_sub.investor_id)
  ) counts;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DATA MIGRATION SUMMARY';
  RAISE NOTICE '============================================================';

  IF total_orphaned = 0 THEN
    RAISE NOTICE '✓ All investor_id references now map to valid user records';
    RAISE NOTICE '✓ You can now proceed with merge_investor_to_user.sql';
  ELSE
    RAISE WARNING '✗ Still have % orphaned records', total_orphaned;
    RAISE NOTICE 'Check the verification queries above for details';
  END IF;

  RAISE NOTICE '============================================================';
END $$;
