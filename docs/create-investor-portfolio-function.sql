-- PostgreSQL Function: Investor Portfolio Summary
-- Run this in Supabase SQL Editor to create the required RPC function

-- =============================================
-- INVESTOR PORTFOLIO SUMMARY FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_investor_portfolio_summary(investor_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Structure investments summary
    'totalStructures', (
      SELECT COUNT(DISTINCT si.structure_id)
      FROM structure_investors si
      WHERE si.investor_id = get_investor_portfolio_summary.investor_id
    ),
    'totalCommitment', COALESCE((
      SELECT SUM(si.commitment_amount)
      FROM structure_investors si
      WHERE si.investor_id = get_investor_portfolio_summary.investor_id
    ), 0),
    'totalOwnershipPercent', COALESCE((
      SELECT SUM(si.ownership_percent)
      FROM structure_investors si
      WHERE si.investor_id = get_investor_portfolio_summary.investor_id
    ), 0),

    -- Capital calls summary
    'capitalCalls', json_build_object(
      'totalCalls', COALESCE((
        SELECT COUNT(*)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalAllocated', COALESCE((
        SELECT SUM(cca.allocated_amount)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalPaid', COALESCE((
        SELECT SUM(cca.paid_amount)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalRemaining', COALESCE((
        SELECT SUM(cca.remaining_amount)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'pendingCount', COALESCE((
        SELECT COUNT(*)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
        AND cca.status IN ('Pending', 'Partially Paid')
      ), 0),
      'paidCount', COALESCE((
        SELECT COUNT(*)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
        AND cca.status = 'Paid'
      ), 0)
    ),

    -- Distributions summary
    'distributions', json_build_object(
      'totalDistributions', COALESCE((
        SELECT COUNT(*)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalAllocated', COALESCE((
        SELECT SUM(da.allocated_amount)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalPaid', COALESCE((
        SELECT SUM(da.paid_amount)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'pendingCount', COALESCE((
        SELECT COUNT(*)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
        AND da.status = 'Pending'
      ), 0),
      'paidCount', COALESCE((
        SELECT COUNT(*)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
        AND da.status = 'Paid'
      ), 0)
    ),

    -- Net position
    'netPosition', json_build_object(
      'totalContributed', COALESCE((
        SELECT SUM(cca.paid_amount)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'totalDistributed', COALESCE((
        SELECT SUM(da.paid_amount)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
      ), 0),
      'netCashFlow', COALESCE((
        SELECT SUM(da.paid_amount)
        FROM distribution_allocations da
        WHERE da.investor_id = get_investor_portfolio_summary.investor_id
      ), 0) - COALESCE((
        SELECT SUM(cca.paid_amount)
        FROM capital_call_allocations cca
        WHERE cca.investor_id = get_investor_portfolio_summary.investor_id
      ), 0)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_investor_portfolio_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_investor_portfolio_summary(UUID) IS 'Returns comprehensive portfolio summary for a given investor including structures, capital calls, distributions, and net position';
