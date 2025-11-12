-- PostgreSQL Function: get_distribution_summary
-- Returns aggregated distribution summary for a given structure

CREATE OR REPLACE FUNCTION get_distribution_summary(structure_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalDistributions', COUNT(*),
    'totalAmount', COALESCE(SUM(total_amount), 0),
    'totalEquityGain', COALESCE(SUM(source_equity_gain), 0),
    'totalDebtInterest', COALESCE(SUM(source_debt_interest), 0),
    'totalDebtPrincipal', COALESCE(SUM(source_debt_principal), 0),
    'totalOther', COALESCE(SUM(source_other), 0),
    'totalLpAmount', COALESCE(SUM(lp_total_amount), 0),
    'totalGpAmount', COALESCE(SUM(gp_total_amount), 0),
    'draftCount', COUNT(*) FILTER (WHERE status = 'Draft'),
    'pendingCount', COUNT(*) FILTER (WHERE status = 'Pending'),
    'paidCount', COUNT(*) FILTER (WHERE status = 'Paid'),
    'waterfallAppliedCount', COUNT(*) FILTER (WHERE waterfall_applied = true)
  ) INTO result
  FROM distributions
  WHERE distributions.structure_id = get_distribution_summary.structure_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_distribution_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_distribution_summary(UUID) IS 'Returns aggregated distribution statistics for a given structure';
