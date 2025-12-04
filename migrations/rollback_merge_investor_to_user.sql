-- Rollback Migration: Revert Investor Model Merge
-- This script reverts the changes made by merge_investor_to_user.sql
-- Use this ONLY if you need to rollback the migration

-- ============================================================================
-- STEP 1: Rollback structure_investors table
-- ============================================================================

-- Drop index
DROP INDEX IF EXISTS idx_structure_investors_user_id;

-- Drop new foreign key constraint
ALTER TABLE structure_investors
DROP CONSTRAINT IF EXISTS structure_investors_user_id_fkey;

-- Rename user_id column back to investor_id
ALTER TABLE structure_investors
RENAME COLUMN user_id TO investor_id;

-- Restore original foreign key constraint referencing investors table
ALTER TABLE structure_investors
ADD CONSTRAINT structure_investors_investor_id_fkey
FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Rollback capital_call_allocations table
-- ============================================================================

-- Drop index
DROP INDEX IF EXISTS idx_capital_call_allocations_user_id;

-- Drop new foreign key constraint
ALTER TABLE capital_call_allocations
DROP CONSTRAINT IF EXISTS capital_call_allocations_user_id_fkey;

-- Rename user_id column back to investor_id
ALTER TABLE capital_call_allocations
RENAME COLUMN user_id TO investor_id;

-- Restore original foreign key constraint referencing investors table
ALTER TABLE capital_call_allocations
ADD CONSTRAINT capital_call_allocations_investor_id_fkey
FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: Rollback distribution_allocations table
-- ============================================================================

-- Drop index
DROP INDEX IF EXISTS idx_distribution_allocations_user_id;

-- Drop new foreign key constraint
ALTER TABLE distribution_allocations
DROP CONSTRAINT IF EXISTS distribution_allocations_user_id_fkey;

-- Rename user_id column back to investor_id
ALTER TABLE distribution_allocations
RENAME COLUMN user_id TO investor_id;

-- Restore original foreign key constraint referencing investors table
ALTER TABLE distribution_allocations
ADD CONSTRAINT distribution_allocations_investor_id_fkey
FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: Rollback investment_subscriptions table
-- ============================================================================

-- Drop index
DROP INDEX IF EXISTS idx_investment_subscriptions_user_id;

-- Drop new foreign key constraint
ALTER TABLE investment_subscriptions
DROP CONSTRAINT IF EXISTS investment_subscriptions_user_id_fkey;

-- Rename user_id column back to investor_id
ALTER TABLE investment_subscriptions
RENAME COLUMN user_id TO investor_id;

-- Restore original foreign key constraint referencing investors table
ALTER TABLE investment_subscriptions
ADD CONSTRAINT investment_subscriptions_investor_id_fkey
FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: Rollback database functions/stored procedures
-- ============================================================================

-- Restore get_investor_portfolio_summary function to use investor_id
CREATE OR REPLACE FUNCTION get_investor_portfolio_summary(investor_id UUID)
RETURNS TABLE (
  total_structures INTEGER,
  total_commitment NUMERIC,
  total_invested NUMERIC,
  total_distributions NUMERIC,
  active_structures INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT si.structure_id)::INTEGER AS total_structures,
    COALESCE(SUM(si.commitment_amount), 0) AS total_commitment,
    COALESCE(SUM(s.total_invested), 0) AS total_invested,
    COALESCE(SUM(s.total_distributed), 0) AS total_distributions,
    COUNT(DISTINCT CASE WHEN s.status = 'Active' THEN si.structure_id END)::INTEGER AS active_structures
  FROM structure_investors si
  JOIN structures s ON s.id = si.structure_id
  WHERE si.investor_id = investor_id;
END;
$$ LANGUAGE plpgsql;

-- Restore get_investor_distribution_total function to use investor_id
CREATE OR REPLACE FUNCTION get_investor_distribution_total(p_investor_id UUID, p_structure_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  SELECT COALESCE(SUM(da.allocated_amount), 0)
  INTO total_amount
  FROM distribution_allocations da
  JOIN distributions d ON d.id = da.distribution_id
  WHERE da.investor_id = p_investor_id
    AND d.structure_id = p_structure_id;

  RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Remove comments
-- ============================================================================

COMMENT ON COLUMN structure_investors.investor_id IS NULL;
COMMENT ON COLUMN capital_call_allocations.investor_id IS NULL;
COMMENT ON COLUMN distribution_allocations.investor_id IS NULL;
COMMENT ON COLUMN investment_subscriptions.investor_id IS NULL;
