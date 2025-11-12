-- PostgreSQL Function: get_capital_call_summary
-- Returns aggregated capital call summary for a given structure

CREATE OR REPLACE FUNCTION get_capital_call_summary(structure_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalCalls', COUNT(*),
    'totalCallAmount', COALESCE(SUM(total_call_amount), 0),
    'totalPaidAmount', COALESCE(SUM(total_paid_amount), 0),
    'totalUnpaidAmount', COALESCE(SUM(total_unpaid_amount), 0),
    'draftCount', COUNT(*) FILTER (WHERE status = 'Draft'),
    'sentCount', COUNT(*) FILTER (WHERE status = 'Sent'),
    'partiallyPaidCount', COUNT(*) FILTER (WHERE status = 'Partially Paid'),
    'paidCount', COUNT(*) FILTER (WHERE status = 'Paid')
  ) INTO result
  FROM capital_calls
  WHERE capital_calls.structure_id = get_capital_call_summary.structure_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_capital_call_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_capital_call_summary(UUID) IS 'Returns aggregated capital call statistics for a given structure';
