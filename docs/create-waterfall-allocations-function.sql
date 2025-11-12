-- PostgreSQL Function: Calculate Waterfall Allocations
-- Run this in Supabase SQL Editor to create the required RPC function

-- =============================================
-- CALCULATE WATERFALL ALLOCATIONS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION calculate_waterfall_allocations(
  p_distribution_id UUID,
  p_structure_id UUID
)
RETURNS TABLE (
  distribution_id UUID,
  investor_id UUID,
  allocated_amount NUMERIC,
  paid_amount NUMERIC,
  status TEXT,
  payment_date TIMESTAMPTZ
) AS $$
DECLARE
  dist RECORD;
  lp_pool NUMERIC;
  total_lp_ownership NUMERIC;
  si RECORD;
  investor_allocation NUMERIC;
BEGIN
  -- Get distribution details
  SELECT * INTO dist
  FROM distributions d
  WHERE d.id = p_distribution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Distribution not found';
  END IF;

  -- Verify waterfall has been applied
  IF NOT dist.waterfall_applied THEN
    RAISE EXCEPTION 'Waterfall has not been applied to this distribution';
  END IF;

  -- The LP total amount from waterfall calculation
  lp_pool := dist.lp_total_amount;

  -- Get total LP ownership percentage to calculate proportions
  SELECT COALESCE(SUM(ownership_percent), 100) INTO total_lp_ownership
  FROM structure_investors
  WHERE structure_investors.structure_id = p_structure_id;

  -- Prevent division by zero
  IF total_lp_ownership = 0 THEN
    total_lp_ownership := 100;
  END IF;

  -- Create allocations for each investor based on their ownership percentage
  FOR si IN
    SELECT *
    FROM structure_investors
    WHERE structure_investors.structure_id = p_structure_id
  LOOP
    -- Calculate allocation based on ownership percentage
    -- LP pool is distributed proportionally to all investors based on ownership
    investor_allocation := lp_pool * (si.ownership_percent / total_lp_ownership);

    -- Return the allocation record
    RETURN QUERY
    SELECT
      p_distribution_id,
      si.investor_id,
      investor_allocation,
      0::NUMERIC as paid_amount,
      'Pending'::TEXT as status,
      dist.distribution_date as payment_date;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_waterfall_allocations(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION calculate_waterfall_allocations(UUID, UUID) IS 'Calculates individual investor allocations for a distribution after waterfall has been applied, distributing LP pool proportionally based on ownership percentages';
