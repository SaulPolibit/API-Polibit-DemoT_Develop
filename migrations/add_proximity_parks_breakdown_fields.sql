-- Migration: Add ProximityParks Capital Call Breakdown Fields
-- Purpose: Support the ProximityParks methodology where Total Drawdown (investments + expenses + reserves + fees + VAT)
--          counts toward commitment, not just principal/investments
--
-- Key Change:
-- OLD: Unfunded = Commitment - Principal Called
-- NEW: Unfunded = Commitment - Total Drawdown

-- =====================================================
-- 1. Add fields to capital_call_allocations table
-- =====================================================

-- Investments amount: Actual capital deployment (the "green" line in ProximityParks)
ALTER TABLE capital_call_allocations
ADD COLUMN IF NOT EXISTS investments_amount NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_call_allocations.investments_amount IS 'Actual investment deployment amount (ProximityParks "green" line)';

-- Fund expenses amount: Operating expenses portion
ALTER TABLE capital_call_allocations
ADD COLUMN IF NOT EXISTS fund_expenses_amount NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_call_allocations.fund_expenses_amount IS 'Fund operating expenses allocated to this investor';

-- Reserves amount: Reserve allocations
ALTER TABLE capital_call_allocations
ADD COLUMN IF NOT EXISTS reserves_amount NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_call_allocations.reserves_amount IS 'Reserve allocations for this investor';

-- Total drawdown: Sum of investments + expenses + reserves + fees + VAT
-- This is the amount that counts toward the commitment (ProximityParks methodology)
ALTER TABLE capital_call_allocations
ADD COLUMN IF NOT EXISTS total_drawdown NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_call_allocations.total_drawdown IS 'Total amount counting toward commitment = investments + expenses + reserves + fees + VAT (ProximityParks methodology)';

-- =====================================================
-- 2. Add header-level totals to capital_calls table
-- =====================================================

-- Total investments across all allocations
ALTER TABLE capital_calls
ADD COLUMN IF NOT EXISTS total_investments NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_calls.total_investments IS 'Total investments amount for this capital call';

-- Total fund expenses across all allocations
ALTER TABLE capital_calls
ADD COLUMN IF NOT EXISTS total_fund_expenses NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_calls.total_fund_expenses IS 'Total fund expenses amount for this capital call';

-- Total reserves across all allocations
ALTER TABLE capital_calls
ADD COLUMN IF NOT EXISTS total_reserves NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_calls.total_reserves IS 'Total reserves amount for this capital call';

-- Total drawdown (sum across all allocations)
ALTER TABLE capital_calls
ADD COLUMN IF NOT EXISTS total_drawdown NUMERIC(18, 2) DEFAULT 0;

COMMENT ON COLUMN capital_calls.total_drawdown IS 'Total drawdown amount for this capital call (ProximityParks methodology)';

-- =====================================================
-- 3. Backwards Compatibility: Populate defaults for existing records
-- =====================================================

-- For existing allocations, set total_drawdown = total_due (or principal_amount + fees + vat)
-- and investments_amount = principal_amount (backwards compatibility)
UPDATE capital_call_allocations
SET
    investments_amount = COALESCE(principal_amount, 0),
    total_drawdown = COALESCE(total_due, principal_amount + COALESCE(management_fee_net, 0) + COALESCE(vat_amount, 0), 0)
WHERE total_drawdown = 0 OR total_drawdown IS NULL;

-- For existing capital calls, calculate totals from allocations
UPDATE capital_calls cc
SET
    total_investments = COALESCE((
        SELECT SUM(COALESCE(investments_amount, principal_amount, 0))
        FROM capital_call_allocations cca
        WHERE cca.capital_call_id = cc.id
    ), 0),
    total_drawdown = COALESCE((
        SELECT SUM(COALESCE(total_drawdown, total_due, 0))
        FROM capital_call_allocations cca
        WHERE cca.capital_call_id = cc.id
    ), cc.total_call_amount, 0)
WHERE total_drawdown = 0 OR total_drawdown IS NULL;

-- =====================================================
-- 4. Create index for performance on cumulative calculations
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_capital_call_allocations_total_drawdown
ON capital_call_allocations(user_id, total_drawdown);

CREATE INDEX IF NOT EXISTS idx_capital_call_allocations_investments
ON capital_call_allocations(capital_call_id, investments_amount);

-- =====================================================
-- Verification Query (run after migration to verify)
-- =====================================================
-- SELECT
--     cc.id,
--     cc.call_number,
--     cc.total_call_amount,
--     cc.total_investments,
--     cc.total_drawdown,
--     COUNT(cca.id) as allocation_count,
--     SUM(cca.investments_amount) as sum_investments,
--     SUM(cca.total_drawdown) as sum_drawdown
-- FROM capital_calls cc
-- LEFT JOIN capital_call_allocations cca ON cca.capital_call_id = cc.id
-- GROUP BY cc.id, cc.call_number, cc.total_call_amount, cc.total_investments, cc.total_drawdown
-- ORDER BY cc.created_at DESC
-- LIMIT 10;
