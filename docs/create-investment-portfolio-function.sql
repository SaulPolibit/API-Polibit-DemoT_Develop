-- PostgreSQL Function: Investment Portfolio Summary
-- Run this in Supabase SQL Editor to create the required RPC function

-- =============================================
-- INVESTMENT PORTFOLIO SUMMARY FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_investment_portfolio_summary(structure_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Overall investment counts
    'totalInvestments', COUNT(*),
    'activeCount', COUNT(*) FILTER (WHERE status = 'Active'),
    'exitedCount', COUNT(*) FILTER (WHERE status = 'Exited'),
    'underReviewCount', COUNT(*) FILTER (WHERE status = 'Under Review'),

    -- Investment type breakdown
    'equityCount', COUNT(*) FILTER (WHERE investment_type = 'EQUITY'),
    'debtCount', COUNT(*) FILTER (WHERE investment_type = 'DEBT'),
    'mixedCount', COUNT(*) FILTER (WHERE investment_type = 'MIXED'),

    -- Equity investments summary
    'equity', json_build_object(
      'totalInvested', COALESCE(SUM(equity_invested) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')), 0),
      'totalCurrentValue', COALESCE(SUM(equity_current_value) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')), 0),
      'totalExitValue', COALESCE(SUM(equity_exit_value) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')), 0),
      'totalRealizedGain', COALESCE(SUM(equity_realized_gain) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')), 0),
      'averageOwnershipPercent', COALESCE(AVG(equity_ownership_percent) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')), 0),
      'unrealizedGain', COALESCE(
        SUM(equity_current_value - equity_invested) FILTER (
          WHERE investment_type IN ('EQUITY', 'MIXED')
          AND status = 'Active'
          AND equity_invested IS NOT NULL
          AND equity_current_value IS NOT NULL
        ), 0
      )
    ),

    -- Debt investments summary
    'debt', json_build_object(
      'totalPrincipalProvided', COALESCE(SUM(principal_provided) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')), 0),
      'totalPrincipalRepaid', COALESCE(SUM(principal_repaid) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')), 0),
      'totalOutstandingPrincipal', COALESCE(SUM(outstanding_principal) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')), 0),
      'totalInterestReceived', COALESCE(SUM(interest_received) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')), 0),
      'averageInterestRate', COALESCE(AVG(interest_rate) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')), 0),
      'maturedCount', COUNT(*) FILTER (
        WHERE investment_type IN ('DEBT', 'MIXED')
        AND maturity_date < CURRENT_DATE
      ),
      'activeDebtCount', COUNT(*) FILTER (
        WHERE investment_type IN ('DEBT', 'MIXED')
        AND status = 'Active'
      )
    ),

    -- Performance metrics
    'performance', json_build_object(
      'averageIRR', COALESCE(AVG(irr_percent) FILTER (WHERE irr_percent IS NOT NULL), 0),
      'averageMOIC', COALESCE(AVG(moic) FILTER (WHERE moic IS NOT NULL), 0),
      'totalReturns', COALESCE(SUM(total_returns), 0),
      'bestPerformer', (
        SELECT json_build_object(
          'id', inv.id,
          'name', inv.investment_name,
          'irr', inv.irr_percent,
          'moic', inv.moic
        )
        FROM investments inv
        WHERE inv.structure_id = get_investment_portfolio_summary.structure_id
        AND inv.irr_percent IS NOT NULL
        ORDER BY inv.irr_percent DESC
        LIMIT 1
      )
    ),

    -- Diversification
    'diversification', json_build_object(
      'sectors', (
        SELECT json_agg(DISTINCT inv.sector)
        FROM investments inv
        WHERE inv.structure_id = get_investment_portfolio_summary.structure_id
        AND inv.sector IS NOT NULL
      ),
      'geographies', (
        SELECT json_agg(DISTINCT inv.geography)
        FROM investments inv
        WHERE inv.structure_id = get_investment_portfolio_summary.structure_id
        AND inv.geography IS NOT NULL
      ),
      'currencies', (
        SELECT json_agg(DISTINCT inv.currency)
        FROM investments inv
        WHERE inv.structure_id = get_investment_portfolio_summary.structure_id
        AND inv.currency IS NOT NULL
      )
    ),

    -- Total value
    'totalValue', json_build_object(
      'invested', COALESCE(
        SUM(equity_invested) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')) +
        SUM(principal_provided) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')),
        0
      ),
      'currentValue', COALESCE(
        SUM(equity_current_value) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED') AND status = 'Active') +
        SUM(outstanding_principal) FILTER (WHERE investment_type IN ('DEBT', 'MIXED') AND status = 'Active') +
        SUM(equity_exit_value) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED') AND status = 'Exited') +
        SUM(principal_repaid) FILTER (WHERE investment_type IN ('DEBT', 'MIXED') AND status = 'Exited'),
        0
      ),
      'totalGain', COALESCE(
        SUM(equity_realized_gain) FILTER (WHERE investment_type IN ('EQUITY', 'MIXED')) +
        SUM(interest_received) FILTER (WHERE investment_type IN ('DEBT', 'MIXED')),
        0
      )
    )
  ) INTO result
  FROM investments
  WHERE investments.structure_id = get_investment_portfolio_summary.structure_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_investment_portfolio_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_investment_portfolio_summary(UUID) IS 'Returns comprehensive investment portfolio summary for a structure including equity, debt, performance metrics, and diversification';
