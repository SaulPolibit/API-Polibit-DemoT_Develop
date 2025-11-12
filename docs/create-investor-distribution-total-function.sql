-- PostgreSQL Function: Get Investor Distribution Total
-- Run this in Supabase SQL Editor to create the required RPC function

-- =============================================
-- GET INVESTOR DISTRIBUTION TOTAL FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_investor_distribution_total(
  p_investor_id UUID,
  p_structure_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'investorId', p_investor_id,
    'structureId', p_structure_id,

    -- Total allocations
    'totalAllocations', COALESCE((
      SELECT COUNT(*)
      FROM distribution_allocations da
      JOIN distributions d ON d.id = da.distribution_id
      WHERE da.investor_id = p_investor_id
      AND d.structure_id = p_structure_id
    ), 0),

    -- Total allocated amount
    'totalAllocatedAmount', COALESCE((
      SELECT SUM(da.allocated_amount)
      FROM distribution_allocations da
      JOIN distributions d ON d.id = da.distribution_id
      WHERE da.investor_id = p_investor_id
      AND d.structure_id = p_structure_id
    ), 0),

    -- Total paid amount
    'totalPaidAmount', COALESCE((
      SELECT SUM(da.paid_amount)
      FROM distribution_allocations da
      JOIN distributions d ON d.id = da.distribution_id
      WHERE da.investor_id = p_investor_id
      AND d.structure_id = p_structure_id
    ), 0),

    -- Total pending amount
    'totalPendingAmount', COALESCE((
      SELECT SUM(da.allocated_amount - da.paid_amount)
      FROM distribution_allocations da
      JOIN distributions d ON d.id = da.distribution_id
      WHERE da.investor_id = p_investor_id
      AND d.structure_id = p_structure_id
      AND da.status = 'Pending'
    ), 0),

    -- Status breakdown
    'statusBreakdown', json_build_object(
      'pending', COALESCE((
        SELECT COUNT(*)
        FROM distribution_allocations da
        JOIN distributions d ON d.id = da.distribution_id
        WHERE da.investor_id = p_investor_id
        AND d.structure_id = p_structure_id
        AND da.status = 'Pending'
      ), 0),
      'paid', COALESCE((
        SELECT COUNT(*)
        FROM distribution_allocations da
        JOIN distributions d ON d.id = da.distribution_id
        WHERE da.investor_id = p_investor_id
        AND d.structure_id = p_structure_id
        AND da.status = 'Paid'
      ), 0)
    ),

    -- Recent distributions (last 5)
    'recentDistributions', COALESCE((
      SELECT json_agg(
        json_build_object(
          'distributionId', dist_data.id,
          'distributionNumber', dist_data.distribution_number,
          'distributionDate', dist_data.distribution_date,
          'allocatedAmount', dist_data.allocated_amount,
          'paidAmount', dist_data.paid_amount,
          'status', dist_data.status
        )
      )
      FROM (
        SELECT
          d.id,
          d.distribution_number,
          d.distribution_date,
          da.allocated_amount,
          da.paid_amount,
          da.status
        FROM distribution_allocations da
        JOIN distributions d ON d.id = da.distribution_id
        WHERE da.investor_id = p_investor_id
        AND d.structure_id = p_structure_id
        ORDER BY d.distribution_date DESC
        LIMIT 5
      ) dist_data
    ), '[]'::json)

  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_investor_distribution_total(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_investor_distribution_total(UUID, UUID) IS 'Returns total distribution statistics for a specific investor in a structure, including allocated amounts, paid amounts, status breakdown, and recent distributions';
