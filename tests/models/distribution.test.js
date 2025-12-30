/**
 * Distribution Model Tests
 * Tests for src/models/supabase/distribution.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Distribution = require('../../src/models/supabase/distribution');

describe('Distribution Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new distribution successfully', async () => {
      const distributionData = {
        structureId: 'structure-123',
        distributionNumber: 1,
        distributionDate: '2024-03-15',
        totalAmount: 1000000,
        status: 'Pending',
        source: 'Investment Exit',
        notes: 'Q1 2024 distribution',
        investmentId: 'investment-123',
        sourceEquityGain: 800000,
        sourceDebtInterest: 150000,
        sourceDebtPrincipal: 50000,
        sourceOther: 0,
        waterfallApplied: false,
        lpTotalAmount: 800000,
        gpTotalAmount: 200000,
        managementFeeAmount: 20000,
        createdBy: 'user-admin',
      };

      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Pending',
          source: 'Investment Exit',
          notes: 'Q1 2024 distribution',
          investment_id: 'investment-123',
          source_equity_gain: 800000,
          source_debt_interest: 150000,
          source_debt_principal: 50000,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 20000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const distribution = await Distribution.create(distributionData);

      expect(distribution).toBeDefined();
      expect(distribution.id).toBe('distribution-123');
      expect(distribution.structureId).toBe('structure-123');
      expect(distribution.distributionNumber).toBe(1);
      expect(distribution.totalAmount).toBe(1000000);
      expect(distribution.status).toBe('Pending');
      expect(distribution.lpTotalAmount).toBe(800000);
      expect(distribution.gpTotalAmount).toBe(200000);
    });

    test('should create distribution with waterfall applied', async () => {
      const distributionData = {
        structureId: 'structure-123',
        distributionNumber: 2,
        distributionDate: '2024-06-15',
        totalAmount: 2000000,
        status: 'Pending',
        waterfallApplied: true,
        tier1Amount: 500000,
        tier2Amount: 750000,
        tier3Amount: 500000,
        tier4Amount: 250000,
        lpTotalAmount: 1600000,
        gpTotalAmount: 400000,
        createdBy: 'user-admin',
      };

      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-waterfall',
          structure_id: 'structure-123',
          distribution_number: 2,
          distribution_date: '2024-06-15',
          total_amount: 2000000,
          status: 'Pending',
          source: null,
          notes: null,
          investment_id: null,
          source_equity_gain: null,
          source_debt_interest: null,
          source_debt_principal: null,
          source_other: null,
          waterfall_applied: true,
          tier1_amount: 500000,
          tier2_amount: 750000,
          tier3_amount: 500000,
          tier4_amount: 250000,
          lp_total_amount: 1600000,
          gp_total_amount: 400000,
          management_fee_amount: null,
          created_by: 'user-admin',
          created_at: '2024-06-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
        },
        error: null,
      });

      const distribution = await Distribution.create(distributionData);

      expect(distribution).toBeDefined();
      expect(distribution.waterfallApplied).toBe(true);
      expect(distribution.tier1Amount).toBe(500000);
      expect(distribution.tier2Amount).toBe(750000);
      expect(distribution.tier3Amount).toBe(500000);
      expect(distribution.tier4Amount).toBe(250000);
    });

    test('should throw error if creation fails', async () => {
      const distributionData = {
        structureId: 'structure-123',
        totalAmount: 1000000,
      };

      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Database constraint violation' },
      });

      await expect(Distribution.create(distributionData)).rejects.toThrow(
        'Error creating distribution: Database constraint violation'
      );
    });
  });

  describe('findById', () => {
    test('should find distribution by ID successfully', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Paid',
          source: 'Investment Exit',
          notes: 'Quarterly distribution',
          investment_id: 'investment-123',
          source_equity_gain: 800000,
          source_debt_interest: 200000,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 900000,
          gp_total_amount: 100000,
          management_fee_amount: 15000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-15T00:00:00Z',
        },
        error: null,
      });

      const distribution = await Distribution.findById('distribution-123');

      expect(distribution).toBeDefined();
      expect(distribution.id).toBe('distribution-123');
      expect(distribution.status).toBe('Paid');
      expect(distribution.sourceEquityGain).toBe(800000);
      expect(distribution.sourceDebtInterest).toBe(200000);
    });

    test('should return null if distribution not found', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const distribution = await Distribution.findById('nonexistent-id');

      expect(distribution).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Connection error', code: 'DB_ERROR' },
      });

      await expect(Distribution.findById('distribution-123')).rejects.toThrow(
        'Error finding distribution: Connection error'
      );
    });
  });

  describe('find', () => {
    test('should find all distributions when no filter provided', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-1',
            structure_id: 'structure-123',
            distribution_number: 1,
            distribution_date: '2024-03-15',
            total_amount: 1000000,
            status: 'Paid',
            source: 'Exit',
            notes: null,
            investment_id: null,
            source_equity_gain: 1000000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 800000,
            gp_total_amount: 200000,
            management_fee_amount: 10000,
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-03-15T00:00:00Z',
          },
          {
            id: 'distribution-2',
            structure_id: 'structure-456',
            distribution_number: 1,
            distribution_date: '2024-01-15',
            total_amount: 500000,
            status: 'Pending',
            source: 'Profit',
            notes: null,
            investment_id: null,
            source_equity_gain: 0,
            source_debt_interest: 500000,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 450000,
            gp_total_amount: 50000,
            management_fee_amount: 5000,
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.find();

      expect(distributions).toHaveLength(2);
      expect(distributions[0].id).toBe('distribution-1');
      expect(distributions[1].id).toBe('distribution-2');
    });

    test('should find distributions by status filter', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-pending',
            structure_id: 'structure-123',
            distribution_number: 2,
            distribution_date: '2024-06-15',
            total_amount: 750000,
            status: 'Pending',
            source: 'Profit',
            notes: null,
            investment_id: null,
            source_equity_gain: 750000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 600000,
            gp_total_amount: 150000,
            management_fee_amount: 7500,
            created_by: 'user-admin',
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.find({ status: 'Pending' });

      expect(distributions).toHaveLength(1);
      expect(distributions[0].status).toBe('Pending');
    });

    test('should return empty array if no distributions found', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [],
        error: null,
      });

      const distributions = await Distribution.find({ structureId: 'nonexistent' });

      expect(distributions).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(Distribution.find()).rejects.toThrow(
        'Error finding distributions: Query error'
      );
    });
  });

  describe('findByStructureId', () => {
    test('should find distributions by structure ID', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-1',
            structure_id: 'structure-123',
            distribution_number: 1,
            distribution_date: '2024-03-15',
            total_amount: 1000000,
            status: 'Paid',
            source: 'Exit',
            notes: null,
            investment_id: null,
            source_equity_gain: 1000000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 800000,
            gp_total_amount: 200000,
            management_fee_amount: 10000,
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-03-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.findByStructureId('structure-123');

      expect(distributions).toHaveLength(1);
      expect(distributions[0].structureId).toBe('structure-123');
    });
  });

  describe('findByUserId', () => {
    test('should find distributions created by user', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-1',
            structure_id: 'structure-123',
            distribution_number: 1,
            distribution_date: '2024-03-15',
            total_amount: 1000000,
            status: 'Paid',
            source: 'Exit',
            notes: null,
            investment_id: null,
            source_equity_gain: 1000000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 800000,
            gp_total_amount: 200000,
            management_fee_amount: 10000,
            created_by: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-03-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.findByUserId('user-123');

      expect(distributions).toHaveLength(1);
      expect(distributions[0].createdBy).toBe('user-123');
    });
  });

  describe('findByStatus', () => {
    test('should find distributions by status', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-paid',
            structure_id: 'structure-123',
            distribution_number: 1,
            distribution_date: '2024-03-15',
            total_amount: 1000000,
            status: 'Paid',
            source: 'Exit',
            notes: null,
            investment_id: null,
            source_equity_gain: 1000000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 800000,
            gp_total_amount: 200000,
            management_fee_amount: 10000,
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-03-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.findByStatus('Paid');

      expect(distributions).toHaveLength(1);
      expect(distributions[0].status).toBe('Paid');
    });

    test('should find distributions by status and structure ID', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: [
          {
            id: 'distribution-pending',
            structure_id: 'structure-123',
            distribution_number: 2,
            distribution_date: '2024-06-15',
            total_amount: 500000,
            status: 'Pending',
            source: 'Profit',
            notes: null,
            investment_id: null,
            source_equity_gain: 500000,
            source_debt_interest: 0,
            source_debt_principal: 0,
            source_other: 0,
            waterfall_applied: false,
            tier1_amount: null,
            tier2_amount: null,
            tier3_amount: null,
            tier4_amount: null,
            lp_total_amount: 400000,
            gp_total_amount: 100000,
            management_fee_amount: 5000,
            created_by: 'user-admin',
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const distributions = await Distribution.findByStatus('Pending', 'structure-123');

      expect(distributions).toHaveLength(1);
      expect(distributions[0].status).toBe('Pending');
      expect(distributions[0].structureId).toBe('structure-123');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update distribution successfully', async () => {
      const updateData = {
        status: 'Paid',
        notes: 'Payment completed',
      };

      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Paid',
          source: 'Exit',
          notes: 'Payment completed',
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-15T10:00:00Z',
        },
        error: null,
      });

      const updated = await Distribution.findByIdAndUpdate('distribution-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.status).toBe('Paid');
      expect(updated.notes).toBe('Payment completed');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        Distribution.findByIdAndUpdate('distribution-123', { status: 'Paid' })
      ).rejects.toThrow('Error updating distribution: Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete distribution successfully', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Pending',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await Distribution.findByIdAndDelete('distribution-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('distribution-123');
    });

    test('should throw error if deletion fails', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(Distribution.findByIdAndDelete('distribution-123')).rejects.toThrow(
        'Error deleting distribution: Deletion failed'
      );
    });
  });

  describe('findWithAllocations', () => {
    test('should find distribution with allocations', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Paid',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-15T00:00:00Z',
          distribution_allocations: [
            {
              id: 'allocation-1',
              distribution_id: 'distribution-123',
              user_id: 'investor-1',
              allocated_amount: 400000,
              paid_amount: 400000,
              status: 'Paid',
              user: {
                id: 'investor-1',
                email: 'investor1@example.com',
                first_name: 'John',
                last_name: 'Doe',
              },
            },
          ],
        },
        error: null,
      });

      const distribution = await Distribution.findWithAllocations('distribution-123');

      expect(distribution).toBeDefined();
      expect(distribution.id).toBe('distribution-123');
    });

    test('should throw error if not found', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { message: 'Not found' },
      });

      await expect(Distribution.findWithAllocations('nonexistent')).rejects.toThrow(
        'Error finding distribution with allocations: Not found'
      );
    });
  });

  describe('applyWaterfall', () => {
    test('should apply waterfall calculation', async () => {
      mockSupabase.setMockRpcResponse('apply_waterfall_distribution', {
        data: {
          tier1_amount: 500000,
          tier2_amount: 300000,
          tier3_amount: 150000,
          tier4_amount: 50000,
        },
        error: null,
      });

      const result = await Distribution.applyWaterfall('distribution-123');

      expect(result).toBeDefined();
      expect(result.tier1_amount).toBe(500000);
    });

    test('should throw error if RPC fails', async () => {
      mockSupabase.setMockRpcResponse('apply_waterfall_distribution', {
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(Distribution.applyWaterfall('distribution-123')).rejects.toThrow(
        'Error applying waterfall: RPC error'
      );
    });
  });

  describe('markAsPaid', () => {
    test('should mark distribution as paid', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Paid',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-15T00:00:00Z',
        },
        error: null,
      });

      const updated = await Distribution.markAsPaid('distribution-123');

      expect(updated).toBeDefined();
      expect(updated.status).toBe('Paid');
    });
  });

  describe('getSummary', () => {
    test('should get distribution summary for structure', async () => {
      mockSupabase.setMockRpcResponse('get_distribution_summary', {
        data: {
          total_distributions: 5,
          total_amount: 5000000,
          total_paid: 3000000,
          total_pending: 2000000,
        },
        error: null,
      });

      const summary = await Distribution.getSummary('structure-123');

      expect(summary).toBeDefined();
      expect(summary.total_distributions).toBe(5);
      expect(summary.total_amount).toBe(5000000);
    });

    test('should throw error if RPC fails', async () => {
      mockSupabase.setMockRpcResponse('get_distribution_summary', {
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(Distribution.getSummary('structure-123')).rejects.toThrow(
        'Error getting distribution summary: RPC error'
      );
    });
  });

  describe('createAllocationsForStructure', () => {
    test('should create pro-rata allocations when waterfall not applied', async () => {
      // Mock investments query
      mockSupabase.setMockResponse('investments', {
        data: [
          {
            user_id: 'investor-1',
            ownership_percentage: 40,
            equity_ownership_percent: null,
          },
          {
            user_id: 'investor-2',
            ownership_percentage: 60,
            equity_ownership_percent: null,
          },
        ],
        error: null,
      });

      // Mock distribution lookup
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-123',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Pending',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Mock allocations insert
      mockSupabase.setMockResponse('distribution_allocations', {
        data: [
          {
            id: 'allocation-1',
            distribution_id: 'distribution-123',
            user_id: 'investor-1',
            allocated_amount: 320000,
            paid_amount: 0,
            status: 'Pending',
            payment_date: '2024-03-15',
          },
          {
            id: 'allocation-2',
            distribution_id: 'distribution-123',
            user_id: 'investor-2',
            allocated_amount: 480000,
            paid_amount: 0,
            status: 'Pending',
            payment_date: '2024-03-15',
          },
        ],
        error: null,
      });

      const allocations = await Distribution.createAllocationsForStructure(
        'distribution-123',
        'structure-123'
      );

      expect(allocations).toHaveLength(2);
      expect(allocations[0].allocated_amount).toBe(320000);
      expect(allocations[1].allocated_amount).toBe(480000);
    });

    test('should throw error if distribution not found', async () => {
      // Mock investments query
      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      // Mock distribution not found
      mockSupabase.setMockResponse('distributions', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        Distribution.createAllocationsForStructure('nonexistent', 'structure-123')
      ).rejects.toThrow('Distribution not found');
    });

    test('should throw error if fetching investments fails', async () => {
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(
        Distribution.createAllocationsForStructure('distribution-123', 'structure-123')
      ).rejects.toThrow('Error fetching structure investors: Query error');
    });
  });

  describe('getInvestorDistributionTotal', () => {
    test('should get investor distribution total', async () => {
      mockSupabase.setMockRpcResponse('get_investor_distribution_total', {
        data: {
          total_allocated: 500000,
          total_paid: 300000,
          total_pending: 200000,
        },
        error: null,
      });

      const total = await Distribution.getInvestorDistributionTotal(
        'investor-1',
        'structure-123'
      );

      expect(total).toBeDefined();
      expect(total.total_allocated).toBe(500000);
      expect(total.total_paid).toBe(300000);
    });

    test('should throw error if RPC fails', async () => {
      mockSupabase.setMockRpcResponse('get_investor_distribution_total', {
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(
        Distribution.getInvestorDistributionTotal('investor-1', 'structure-123')
      ).rejects.toThrow('Error getting investor distribution total: RPC error');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'distribution-123',
        structureId: 'structure-123',
        distributionNumber: 1,
        distributionDate: '2024-03-15',
        totalAmount: 1000000,
        status: 'Paid',
        source: 'Exit',
        notes: 'Test distribution',
        investmentId: 'investment-123',
        sourceEquityGain: 800000,
        sourceDebtInterest: 150000,
        sourceDebtPrincipal: 50000,
        sourceOther: 0,
        waterfallApplied: true,
        tier1Amount: 500000,
        tier2Amount: 300000,
        tier3Amount: 150000,
        tier4Amount: 50000,
        lpTotalAmount: 800000,
        gpTotalAmount: 200000,
        managementFeeAmount: 10000,
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
      };

      const dbData = Distribution._toDbFields(modelData);

      expect(dbData.id).toBe('distribution-123');
      expect(dbData.structure_id).toBe('structure-123');
      expect(dbData.distribution_number).toBe(1);
      expect(dbData.distribution_date).toBe('2024-03-15');
      expect(dbData.total_amount).toBe(1000000);
      expect(dbData.status).toBe('Paid');
      expect(dbData.source).toBe('Exit');
      expect(dbData.notes).toBe('Test distribution');
      expect(dbData.investment_id).toBe('investment-123');
      expect(dbData.source_equity_gain).toBe(800000);
      expect(dbData.source_debt_interest).toBe(150000);
      expect(dbData.source_debt_principal).toBe(50000);
      expect(dbData.source_other).toBe(0);
      expect(dbData.waterfall_applied).toBe(true);
      expect(dbData.tier1_amount).toBe(500000);
      expect(dbData.tier2_amount).toBe(300000);
      expect(dbData.tier3_amount).toBe(150000);
      expect(dbData.tier4_amount).toBe(50000);
      expect(dbData.lp_total_amount).toBe(800000);
      expect(dbData.gp_total_amount).toBe(200000);
      expect(dbData.management_fee_amount).toBe(10000);
      expect(dbData.created_by).toBe('user-admin');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-03-15T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'distribution-123',
        structure_id: 'structure-123',
        distribution_number: 1,
        distribution_date: '2024-03-15',
        total_amount: 1000000,
        status: 'Paid',
        source: 'Exit',
        notes: 'Test',
        investment_id: 'investment-123',
        source_equity_gain: 800000,
        source_debt_interest: 150000,
        source_debt_principal: 50000,
        source_other: 0,
        waterfall_applied: true,
        tier1_amount: 500000,
        tier2_amount: 300000,
        tier3_amount: 150000,
        tier4_amount: 50000,
        lp_total_amount: 800000,
        gp_total_amount: 200000,
        management_fee_amount: 10000,
        created_by: 'user-admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      };

      const modelData = Distribution._toModel(dbData);

      expect(modelData.id).toBe('distribution-123');
      expect(modelData.structureId).toBe('structure-123');
      expect(modelData.distributionNumber).toBe(1);
      expect(modelData.distributionDate).toBe('2024-03-15');
      expect(modelData.totalAmount).toBe(1000000);
      expect(modelData.status).toBe('Paid');
      expect(modelData.source).toBe('Exit');
      expect(modelData.notes).toBe('Test');
      expect(modelData.investmentId).toBe('investment-123');
      expect(modelData.sourceEquityGain).toBe(800000);
      expect(modelData.sourceDebtInterest).toBe(150000);
      expect(modelData.sourceDebtPrincipal).toBe(50000);
      expect(modelData.sourceOther).toBe(0);
      expect(modelData.waterfallApplied).toBe(true);
      expect(modelData.tier1Amount).toBe(500000);
      expect(modelData.tier2Amount).toBe(300000);
      expect(modelData.tier3Amount).toBe(150000);
      expect(modelData.tier4Amount).toBe(50000);
      expect(modelData.lpTotalAmount).toBe(800000);
      expect(modelData.gpTotalAmount).toBe(200000);
      expect(modelData.managementFeeAmount).toBe(10000);
      expect(modelData.createdBy).toBe('user-admin');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-03-15T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = Distribution._toModel(null);
      expect(modelData).toBeNull();
    });
  });

  describe('Distribution statuses', () => {
    test('should handle Pending status', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-pending',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Pending',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const distribution = await Distribution.findById('distribution-pending');

      expect(distribution.status).toBe('Pending');
    });

    test('should handle Paid status', async () => {
      mockSupabase.setMockResponse('distributions', {
        data: {
          id: 'distribution-paid',
          structure_id: 'structure-123',
          distribution_number: 1,
          distribution_date: '2024-03-15',
          total_amount: 1000000,
          status: 'Paid',
          source: 'Exit',
          notes: null,
          investment_id: null,
          source_equity_gain: 1000000,
          source_debt_interest: 0,
          source_debt_principal: 0,
          source_other: 0,
          waterfall_applied: false,
          tier1_amount: null,
          tier2_amount: null,
          tier3_amount: null,
          tier4_amount: null,
          lp_total_amount: 800000,
          gp_total_amount: 200000,
          management_fee_amount: 10000,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-15T00:00:00Z',
        },
        error: null,
      });

      const distribution = await Distribution.findById('distribution-paid');

      expect(distribution.status).toBe('Paid');
    });
  });
});
