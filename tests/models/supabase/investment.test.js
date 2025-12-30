/**
 * Tests for Investment Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Investment = require('../../../src/models/supabase/investment');

describe('Investment Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create an EQUITY investment successfully', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Tech Startup A',
        investmentType: 'EQUITY',
        equityInvested: 1000000,
        ownershipPercentage: 15.5,
        investmentDate: '2024-01-15',
        status: 'Active',
        userId: 'user-123'
      };

      const dbResponse = {
        id: 'investment-123',
        structure_id: 'structure-123',
        investment_name: 'Tech Startup A',
        investment_type: 'EQUITY',
        equity_invested: 1000000,
        ownership_percentage: 15.5,
        investment_date: '2024-01-15',
        status: 'Active',
        user_id: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.create(investmentData);

      expect(result.id).toBe('investment-123');
      expect(result.structureId).toBe('structure-123');
      expect(result.investmentName).toBe('Tech Startup A');
      expect(result.investmentType).toBe('EQUITY');
      expect(result.equityInvested).toBe(1000000);
      expect(result.ownershipPercentage).toBe(15.5);
    });

    test('should create a DEBT investment successfully', async () => {
      const investmentData = {
        structureId: 'structure-456',
        investmentName: 'Corporate Bond',
        investmentType: 'DEBT',
        principalProvided: 500000,
        interestRate: 5.5,
        maturityDate: '2026-12-31',
        investmentDate: '2024-01-15',
        status: 'Active',
        userId: 'user-456'
      };

      const dbResponse = {
        id: 'investment-456',
        structure_id: 'structure-456',
        investment_name: 'Corporate Bond',
        investment_type: 'DEBT',
        principal_provided: 500000,
        interest_rate: 5.5,
        maturity_date: '2026-12-31',
        investment_date: '2024-01-15',
        status: 'Active',
        user_id: 'user-456',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.create(investmentData);

      expect(result.investmentType).toBe('DEBT');
      expect(result.principalProvided).toBe(500000);
      expect(result.interestRate).toBe(5.5);
      expect(result.maturityDate).toBe('2026-12-31');
    });

    test('should create a MIXED investment successfully', async () => {
      const investmentData = {
        structureId: 'structure-789',
        investmentName: 'Hybrid Investment',
        investmentType: 'MIXED',
        equityInvested: 750000,
        principalProvided: 250000,
        ownershipPercentage: 10,
        interestRate: 3.5,
        status: 'Active',
        userId: 'user-789'
      };

      const dbResponse = {
        id: 'investment-789',
        structure_id: 'structure-789',
        investment_name: 'Hybrid Investment',
        investment_type: 'MIXED',
        equity_invested: 750000,
        principal_provided: 250000,
        ownership_percentage: 10,
        interest_rate: 3.5,
        status: 'Active',
        user_id: 'user-789'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.create(investmentData);

      expect(result.investmentType).toBe('MIXED');
      expect(result.equityInvested).toBe(750000);
      expect(result.principalProvided).toBe(250000);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.create({})).rejects.toThrow('Error creating investment');
    });
  });

  describe('findById', () => {
    test('should find investment by ID successfully', async () => {
      const dbResponse = {
        id: 'investment-123',
        structure_id: 'structure-123',
        investment_name: 'Tech Startup',
        investment_type: 'EQUITY',
        equity_invested: 1000000,
        status: 'Active'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.id).toBe('investment-123');
      expect(result.investmentName).toBe('Tech Startup');
    });

    test('should return null if investment not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      const result = await Investment.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.findById('investment-123')).rejects.toThrow('Error finding investment');
    });
  });

  describe('find', () => {
    test('should find all investments when no filter provided', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          structure_id: 'structure-123',
          investment_name: 'Investment 1',
          investment_type: 'EQUITY',
          status: 'Active'
        },
        {
          id: 'investment-2',
          structure_id: 'structure-456',
          investment_name: 'Investment 2',
          investment_type: 'DEBT',
          status: 'Active'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('investment-1');
      expect(result[1].id).toBe('investment-2');
    });

    test('should filter investments by structure ID', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          structure_id: 'structure-123',
          investment_name: 'Investment 1',
          status: 'Active'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.find({ structureId: 'structure-123' });

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('structure-123');
    });

    test('should filter investments by investment type', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          investment_type: 'EQUITY',
          status: 'Active'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.find({ investmentType: 'EQUITY' });

      expect(result).toHaveLength(1);
      expect(result[0].investmentType).toBe('EQUITY');
    });

    test('should return empty array if no investments found', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null
      });

      const result = await Investment.find();
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.find()).rejects.toThrow('Error finding investments');
    });
  });

  describe('findByStructureId', () => {
    test('should find investments by structure ID', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          structure_id: 'structure-123',
          investment_name: 'Investment 1'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findByStructureId('structure-123');

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('structure-123');
    });
  });

  describe('findByProjectId', () => {
    test('should find investments by project ID', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          project_id: 'project-123',
          investment_name: 'Investment 1'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findByProjectId('project-123');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-123');
    });
  });

  describe('findByUserId', () => {
    test('should find investments by user ID', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          user_id: 'user-123',
          investment_name: 'Investment 1'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findByUserId('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
    });
  });

  describe('findActive', () => {
    test('should find all active investments without structure filter', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          status: 'Active',
          investment_name: 'Active Investment 1'
        },
        {
          id: 'investment-2',
          status: 'Active',
          investment_name: 'Active Investment 2'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findActive();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('Active');
      expect(result[1].status).toBe('Active');
    });

    test('should find active investments for specific structure', async () => {
      const dbResponse = [
        {
          id: 'investment-1',
          structure_id: 'structure-123',
          status: 'Active',
          investment_name: 'Active Investment'
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findActive('structure-123');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Active');
      expect(result[0].structureId).toBe('structure-123');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.findActive()).rejects.toThrow('Error finding active investments');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update investment successfully', async () => {
      const updateData = {
        equityCurrentValue: 1500000,
        status: 'Active'
      };

      const dbResponse = {
        id: 'investment-123',
        equity_current_value: 1500000,
        status: 'Active',
        updated_at: '2024-02-01T10:00:00Z'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findByIdAndUpdate('investment-123', updateData);

      expect(result.id).toBe('investment-123');
      expect(result.equityCurrentValue).toBe(1500000);
      expect(result.status).toBe('Active');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.findByIdAndUpdate('investment-123', {})).rejects.toThrow('Error updating investment');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete investment successfully', async () => {
      const dbResponse = {
        id: 'investment-123',
        investment_name: 'Deleted Investment'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findByIdAndDelete('investment-123');

      expect(result.id).toBe('investment-123');
      expect(result.investmentName).toBe('Deleted Investment');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.findByIdAndDelete('investment-123')).rejects.toThrow('Error deleting investment');
    });
  });

  describe('findWithStructure', () => {
    test('should find investment with structure details', async () => {
      const dbResponse = {
        id: 'investment-123',
        structure_id: 'structure-123',
        investment_name: 'Tech Startup',
        structure: {
          id: 'structure-123',
          name: 'Main Structure',
          type: 'Fund'
        }
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findWithStructure('investment-123');

      expect(result.id).toBe('investment-123');
      expect(result.investmentName).toBe('Tech Startup');
    });

    test('should throw error if query fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investment.findWithStructure('investment-123')).rejects.toThrow('Error finding investment with structure');
    });
  });

  describe('updatePerformanceMetrics', () => {
    test('should update performance metrics successfully', async () => {
      const metrics = {
        irrPercent: 25.5,
        moic: 2.5,
        totalReturns: 1500000,
        equityCurrentValue: 2500000
      };

      const dbResponse = {
        id: 'investment-123',
        irr_percent: 25.5,
        moic: 2.5,
        total_returns: 1500000,
        equity_current_value: 2500000
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.updatePerformanceMetrics('investment-123', metrics);

      expect(result.irrPercent).toBe(25.5);
      expect(result.moic).toBe(2.5);
      expect(result.totalReturns).toBe(1500000);
      expect(result.equityCurrentValue).toBe(2500000);
    });

    test('should update only provided metrics', async () => {
      const metrics = {
        irrPercent: 15.0
      };

      const dbResponse = {
        id: 'investment-123',
        irr_percent: 15.0
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.updatePerformanceMetrics('investment-123', metrics);

      expect(result.irrPercent).toBe(15.0);
    });
  });

  describe('getPortfolioSummary', () => {
    test('should get portfolio summary for structure', async () => {
      const summaryData = {
        total_investments: 10,
        total_invested: 5000000,
        total_current_value: 6500000,
        total_returns: 1500000,
        average_irr: 18.5
      };

      mockSupabase.setMockRpcResponse('get_investment_portfolio_summary', {
        data: summaryData,
        error: null
      });

      const result = await Investment.getPortfolioSummary('structure-123');

      expect(result.total_investments).toBe(10);
      expect(result.total_invested).toBe(5000000);
      expect(result.total_current_value).toBe(6500000);
    });

    test('should throw error if RPC fails', async () => {
      const error = new Error('RPC error');
      mockSupabase.setMockRpcResponse('get_investment_portfolio_summary', {
        data: null,
        error: error
      });

      await expect(Investment.getPortfolioSummary('structure-123')).rejects.toThrow('Error getting portfolio summary');
    });
  });

  describe('markAsExited', () => {
    test('should mark investment as exited with exit value', async () => {
      const exitData = {
        exitDate: '2024-12-31',
        equityExitValue: 2000000
      };

      // Mock findById call
      const findByIdResponse = {
        id: 'investment-123',
        equity_invested: 1000000,
        investment_name: 'Exiting Investment'
      };

      // Mock update call
      const updateResponse = {
        id: 'investment-123',
        status: 'Exited',
        exit_date: '2024-12-31',
        equity_exit_value: 2000000,
        equity_realized_gain: 1000000
      };

      mockSupabase.setMockResponse('investments', {
        data: findByIdResponse,
        error: null
      });

      mockSupabase.setMockResponse('investments', {
        data: updateResponse,
        error: null
      });

      const result = await Investment.markAsExited('investment-123', exitData);

      expect(result.status).toBe('Exited');
      expect(result.exitDate).toBe('2024-12-31');
      expect(result.equityExitValue).toBe(2000000);
      expect(result.equityRealizedGain).toBe(1000000);
    });

    test('should mark investment as exited without exit value', async () => {
      const exitData = {
        exitDate: '2024-12-31'
      };

      const updateResponse = {
        id: 'investment-123',
        status: 'Exited',
        exit_date: '2024-12-31'
      };

      mockSupabase.setMockResponse('investments', {
        data: updateResponse,
        error: null
      });

      const result = await Investment.markAsExited('investment-123', exitData);

      expect(result.status).toBe('Exited');
      expect(result.exitDate).toBe('2024-12-31');
    });

    test('should use current date if exitDate not provided', async () => {
      const exitData = {
        equityExitValue: 2000000
      };

      // Mock findById call
      const findByIdResponse = {
        id: 'investment-123',
        equity_invested: 1000000
      };

      mockSupabase.setMockResponse('investments', {
        data: findByIdResponse,
        error: null
      });

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-123',
          status: 'Exited',
          exit_date: new Date().toISOString(),
          equity_exit_value: 2000000,
          equity_realized_gain: 1000000
        },
        error: null
      });

      const result = await Investment.markAsExited('investment-123', exitData);

      expect(result.status).toBe('Exited');
      expect(result.exitDate).toBeDefined();
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Test Investment',
        investmentType: 'EQUITY',
        equityInvested: 1000000,
        ownershipPercentage: 15.5,
        currentEquityValue: 1200000,
        principalProvided: 500000,
        interestRate: 5.0,
        irrPercent: 20.5,
        totalReturns: 500000,
        userId: 'user-123'
      };

      const dbResponse = {
        id: 'investment-123',
        structure_id: 'structure-123',
        investment_name: 'Test Investment',
        investment_type: 'EQUITY',
        equity_invested: 1000000,
        ownership_percentage: 15.5,
        current_equity_value: 1200000,
        principal_provided: 500000,
        interest_rate: 5.0,
        irr_percent: 20.5,
        total_returns: 500000,
        user_id: 'user-123'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.create(investmentData);

      expect(result.structureId).toBe('structure-123');
      expect(result.investmentName).toBe('Test Investment');
      expect(result.equityInvested).toBe(1000000);
      expect(result.ownershipPercentage).toBe(15.5);
      expect(result.currentEquityValue).toBe(1200000);
      expect(result.principalProvided).toBe(500000);
      expect(result.interestRate).toBe(5.0);
      expect(result.irrPercent).toBe(20.5);
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'investment-123',
        structure_id: 'structure-123',
        project_id: 'project-456',
        investment_name: 'Test Investment',
        investment_type: 'DEBT',
        principal_provided: 500000,
        interest_rate: 5.5,
        maturity_date: '2026-12-31',
        outstanding_principal: 450000,
        accrued_interest: 25000,
        irr_percent: 12.5,
        total_returns: 75000,
        user_id: 'user-123',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.structureId).toBe('structure-123');
      expect(result.projectId).toBe('project-456');
      expect(result.investmentName).toBe('Test Investment');
      expect(result.investmentType).toBe('DEBT');
      expect(result.principalProvided).toBe(500000);
      expect(result.interestRate).toBe(5.5);
      expect(result.maturityDate).toBe('2026-12-31');
      expect(result.outstandingPrincipal).toBe(450000);
      expect(result.accruedInterest).toBe(25000);
      expect(result.irrPercent).toBe(12.5);
      expect(result.totalReturns).toBe(75000);
      expect(result.userId).toBe('user-123');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    test('should handle null values in transformation', async () => {
      const dbResponse = {
        id: 'investment-123',
        investment_name: 'Test Investment',
        exit_date: null,
        equity_exit_value: null,
        maturity_date: null
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.exitDate).toBeNull();
      expect(result.equityExitValue).toBeNull();
      expect(result.maturityDate).toBeNull();
    });

    test('should handle partial data transformation', async () => {
      const investmentData = {
        investmentName: 'Partial Investment',
        status: 'Active'
      };

      const dbResponse = {
        id: 'investment-123',
        investment_name: 'Partial Investment',
        status: 'Active'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.create(investmentData);

      expect(result.investmentName).toBe('Partial Investment');
      expect(result.status).toBe('Active');
    });
  });

  describe('Investment types', () => {
    test('should handle EQUITY investment type', async () => {
      const dbResponse = {
        id: 'investment-123',
        investment_type: 'EQUITY',
        equity_invested: 1000000,
        ownership_percentage: 15.5,
        status: 'Active'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.investmentType).toBe('EQUITY');
      expect(result.equityInvested).toBe(1000000);
      expect(result.ownershipPercentage).toBe(15.5);
    });

    test('should handle DEBT investment type', async () => {
      const dbResponse = {
        id: 'investment-123',
        investment_type: 'DEBT',
        principal_provided: 500000,
        interest_rate: 5.5,
        maturity_date: '2026-12-31',
        status: 'Active'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.investmentType).toBe('DEBT');
      expect(result.principalProvided).toBe(500000);
      expect(result.interestRate).toBe(5.5);
      expect(result.maturityDate).toBe('2026-12-31');
    });

    test('should handle MIXED investment type', async () => {
      const dbResponse = {
        id: 'investment-123',
        investment_type: 'MIXED',
        equity_invested: 750000,
        principal_provided: 250000,
        ownership_percentage: 10,
        interest_rate: 3.5,
        status: 'Active'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.investmentType).toBe('MIXED');
      expect(result.equityInvested).toBe(750000);
      expect(result.principalProvided).toBe(250000);
    });
  });

  describe('Investment statuses', () => {
    test('should handle Active status', async () => {
      const dbResponse = {
        id: 'investment-123',
        status: 'Active',
        investment_name: 'Active Investment'
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.status).toBe('Active');
    });

    test('should handle Exited status', async () => {
      const dbResponse = {
        id: 'investment-123',
        status: 'Exited',
        exit_date: '2024-12-31',
        equity_exit_value: 2000000,
        equity_realized_gain: 1000000
      };

      mockSupabase.setMockResponse('investments', {
        data: dbResponse,
        error: null
      });

      const result = await Investment.findById('investment-123');

      expect(result.status).toBe('Exited');
      expect(result.exitDate).toBe('2024-12-31');
      expect(result.equityExitValue).toBe(2000000);
      expect(result.equityRealizedGain).toBe(1000000);
    });
  });
});
