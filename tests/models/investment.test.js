/**
 * Investment Model Tests
 * Tests for src/models/supabase/investment.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Investment = require('../../src/models/supabase/investment');

describe('Investment Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSupabase.reset();
  });

  describe('create', () => {
    test('should create an EQUITY investment', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Test Investment',
        investmentType: 'EQUITY',
        equityInvested: 100000,
        ownershipPercentage: 10.5,
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          structure_id: 'structure-123',
          investment_name: 'Test Investment',
          investment_type: 'EQUITY',
          equity_invested: 100000,
          ownership_percentage: 10.5,
          user_id: 'user-123',
          status: 'Active',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Investment.create(investmentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('investment-123');
      expect(result.investmentType).toBe('EQUITY');
      expect(result.equityInvested).toBe(100000);
    });

    test('should create a DEBT investment', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Debt Investment',
        investmentType: 'DEBT',
        principalProvided: 500000,
        interestRate: 5.5,
        maturityDate: '2025-12-31',
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-debt',
          structure_id: 'structure-123',
          investment_name: 'Debt Investment',
          investment_type: 'DEBT',
          principal_provided: 500000,
          interest_rate: 5.5,
          maturity_date: '2025-12-31',
          user_id: 'user-123',
        },
        error: null,
      });

      const result = await Investment.create(investmentData);

      expect(result.investmentType).toBe('DEBT');
      expect(result.principalProvided).toBe(500000);
      expect(result.interestRate).toBe(5.5);
    });

    test('should create a MIXED investment', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Mixed Investment',
        investmentType: 'MIXED',
        equityInvested: 200000,
        principalProvided: 300000,
        interestRate: 4.0,
        ownershipPercentage: 5.0,
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-mixed',
          investment_type: 'MIXED',
          equity_invested: 200000,
          principal_provided: 300000,
          interest_rate: 4.0,
          ownership_percentage: 5.0,
        },
        error: null,
      });

      const result = await Investment.create(investmentData);

      expect(result.investmentType).toBe('MIXED');
      expect(result.equityInvested).toBe(200000);
      expect(result.principalProvided).toBe(300000);
    });
  });

  describe('findById', () => {
    test('should find investment by ID', async () => {
      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          investment_name: 'Test Investment',
          investment_type: 'EQUITY',
          structure_id: 'structure-123',
        },
        error: null,
      });

      const result = await Investment.findById('investment-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('investment-123');
    });

    test('should return null if investment not found', async () => {
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await Investment.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    test('should find investments by structure ID', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [
          {
            id: 'inv-1',
            structure_id: 'structure-123',
            investment_type: 'EQUITY',
          },
          {
            id: 'inv-2',
            structure_id: 'structure-123',
            investment_type: 'DEBT',
          },
        ],
        error: null,
      });

      const result = await Investment.find({ structureId: 'structure-123' });

      expect(result).toHaveLength(2);
    });

    test('should filter by investment type', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [
          {
            id: 'inv-equity',
            investment_type: 'EQUITY',
          },
        ],
        error: null,
      });

      const result = await Investment.find({ investmentType: 'EQUITY' });

      expect(result).toHaveLength(1);
      expect(result[0].investmentType).toBe('EQUITY');
    });
  });

  describe('findActive', () => {
    test('should find active investments', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [
          {
            id: 'inv-1',
            status: 'Active',
            structure_id: 'structure-123',
          },
          {
            id: 'inv-2',
            status: 'Active',
            structure_id: 'structure-123',
          },
        ],
        error: null,
      });

      const result = await Investment.findActive('structure-123');

      expect(result).toHaveLength(2);
      result.forEach(inv => {
        expect(inv.status).toBe('Active');
      });
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update investment successfully', async () => {
      const updateData = {
        currentValue: 150000,
        irr: 12.5,
        multiple: 1.5,
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          current_value: 150000,
          irr: 12.5,
          multiple: 1.5,
        },
        error: null,
      });

      const result = await Investment.findByIdAndUpdate('investment-123', updateData);

      expect(result.currentValue).toBe(150000);
      expect(result.irr).toBe(12.5);
      expect(result.multiple).toBe(1.5);
    });
  });

  describe('updatePerformanceMetrics', () => {
    test('should update performance metrics', async () => {
      const metrics = {
        irrPercent: 15.5,
        moic: 2.0,
        totalReturns: 200000,
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          irr_percent: 15.5,
          moic: 2.0,
          total_returns: 200000,
        },
        error: null,
      });

      const result = await Investment.updatePerformanceMetrics('investment-123', metrics);

      expect(result.irrPercent).toBe(15.5);
      expect(result.moic).toBe(2.0);
      expect(result.totalReturns).toBe(200000);
    });
  });

  describe('markAsExited', () => {
    test('should mark investment as exited', async () => {
      const exitData = {
        exitDate: '2024-12-31',
        equityExitValue: 250000,
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          status: 'Exited',
          exit_date: '2024-12-31',
          equity_exit_value: 250000,
        },
        error: null,
      });

      const result = await Investment.markAsExited('investment-123', exitData);

      expect(result.status).toBe('Exited');
      expect(result.exitDate).toBe('2024-12-31');
      expect(result.equityExitValue).toBe(250000);
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete investment successfully', async () => {
      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          investment_name: 'Deleted Investment',
        },
        error: null,
      });

      const result = await Investment.findByIdAndDelete('investment-123');

      expect(result.id).toBe('investment-123');
    });
  });

  // getPortfolioSummary might be a custom RPC - test would need actual implementation

  describe('Field Validation', () => {
    test('should handle optional fields correctly', async () => {
      const minimalInvestment = {
        structureId: 'structure-123',
        investmentName: 'Minimal Investment',
        investmentType: 'EQUITY',
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-minimal',
          structure_id: 'structure-123',
          investment_name: 'Minimal Investment',
          investment_type: 'EQUITY',
          user_id: 'user-123',
        },
        error: null,
      });

      const result = await Investment.create(minimalInvestment);

      expect(result).toBeDefined();
    });
  });
});
