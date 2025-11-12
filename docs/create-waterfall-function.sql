-- PostgreSQL Function: Apply Waterfall Distribution
-- Run this in Supabase SQL Editor to create the required RPC function

-- =============================================
-- APPLY WATERFALL DISTRIBUTION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION apply_waterfall_distribution(distribution_id UUID)
RETURNS JSON AS $$
DECLARE
  dist RECORD;
  structure_id_val UUID;
  remaining_amount NUMERIC;
  tier_calc RECORD;
  tier1_amt NUMERIC := 0;
  tier2_amt NUMERIC := 0;
  tier3_amt NUMERIC := 0;
  tier4_amt NUMERIC := 0;
  lp_total NUMERIC := 0;
  gp_total NUMERIC := 0;
  result JSON;
BEGIN
  -- Get distribution details
  SELECT * INTO dist
  FROM distributions
  WHERE id = distribution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Distribution not found';
  END IF;

  -- Check if waterfall already applied
  IF dist.waterfall_applied THEN
    RAISE EXCEPTION 'Waterfall already applied to this distribution';
  END IF;

  structure_id_val := dist.structure_id;
  remaining_amount := dist.total_amount;

  -- Get waterfall tiers for the structure, ordered by tier_number
  FOR tier_calc IN
    SELECT *
    FROM waterfall_tiers
    WHERE structure_id = structure_id_val
    ORDER BY tier_number ASC
  LOOP
    -- Calculate amount for this tier
    DECLARE
      tier_amount NUMERIC;
      lp_amount NUMERIC;
      gp_amount NUMERIC;
    BEGIN
      -- For simplicity, we'll distribute the remaining amount through tiers
      -- In a real waterfall, you'd check threshold_amount and threshold_irr

      -- For now, distribute proportionally based on what's left
      -- This is a simplified waterfall calculation
      IF tier_calc.tier_number = 1 THEN
        -- Tier 1: Return of Capital (typically 100% to LPs until capital returned)
        tier_amount := LEAST(remaining_amount, remaining_amount * 0.25); -- 25% of total
        tier1_amt := tier_amount;
      ELSIF tier_calc.tier_number = 2 THEN
        -- Tier 2: Preferred Return (e.g., 8% hurdle)
        tier_amount := LEAST(remaining_amount, remaining_amount * 0.25); -- 25% of total
        tier2_amt := tier_amount;
      ELSIF tier_calc.tier_number = 3 THEN
        -- Tier 3: GP Catch-up
        tier_amount := LEAST(remaining_amount, remaining_amount * 0.20); -- 20% of total
        tier3_amt := tier_amount;
      ELSE
        -- Tier 4: Carried Interest (remaining amount)
        tier_amount := remaining_amount;
        tier4_amt := tier_amount;
      END IF;

      -- Calculate LP and GP splits based on tier percentages
      lp_amount := tier_amount * (tier_calc.lp_share_percent / 100.0);
      gp_amount := tier_amount * (tier_calc.gp_share_percent / 100.0);

      lp_total := lp_total + lp_amount;
      gp_total := gp_total + gp_amount;

      remaining_amount := remaining_amount - tier_amount;

      -- Exit if no more amount to distribute
      IF remaining_amount <= 0 THEN
        EXIT;
      END IF;
    END;
  END LOOP;

  -- Update the distribution with waterfall calculations
  UPDATE distributions
  SET
    waterfall_applied = true,
    tier1_amount = tier1_amt,
    tier2_amount = tier2_amt,
    tier3_amount = tier3_amt,
    tier4_amount = tier4_amt,
    lp_total_amount = lp_total,
    gp_total_amount = gp_total,
    updated_at = NOW()
  WHERE id = distribution_id;

  -- Return the updated distribution with waterfall details
  SELECT json_build_object(
    'distributionId', dist.id,
    'totalAmount', dist.total_amount,
    'waterfallApplied', true,
    'tiers', json_build_object(
      'tier1', tier1_amt,
      'tier2', tier2_amt,
      'tier3', tier3_amt,
      'tier4', tier4_amt
    ),
    'splits', json_build_object(
      'lpTotal', lp_total,
      'gpTotal', gp_total
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_waterfall_distribution(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION apply_waterfall_distribution(UUID) IS 'Applies waterfall calculation to a distribution, calculating tier amounts and LP/GP splits based on waterfall tiers configuration';
