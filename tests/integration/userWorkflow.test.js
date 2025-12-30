/**
 * User Workflow Integration Tests
 * Tests complete user workflows across multiple models
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const { getSupabase } = require('../../src/config/database');
const User = require('../../src/models/supabase/user');
const Structure = require('../../src/models/supabase/structure');
const Investment = require('../../src/models/supabase/investment');

describe('User Workflow Integration Tests', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSupabase.reset();
  });

  describe('Complete Investment Workflow', () => {
    test('should create user, structure, and investment successfully', async () => {
      // Step 1: Create User
      const userData = {
        email: 'investor@example.com',
        password: 'secure123',
        firstName: 'John',
        lastName: 'Investor',
        role: 1, // ADMIN
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-investor',
          email: 'investor@example.com',
          first_name: 'John',
          last_name: 'Investor',
          role: 1,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const user = await User.create(userData);
      expect(user).toBeDefined();
      expect(user.id).toBe('user-investor');

      // Step 2: Create Structure
      const structureData = {
        name: 'Tech Fund I',
        type: 'FUND',
        baseCurrency: 'USD',
        totalCommitment: 10000000,
        createdBy: user.id,
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-fund',
          name: 'Tech Fund I',
          type: 'FUND',
          base_currency: 'USD',
          total_commitment: 10000000,
          created_by: 'user-investor',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const structure = await Structure.create(structureData);
      expect(structure).toBeDefined();
      expect(structure.id).toBe('structure-fund');
      expect(structure.createdBy).toBe(user.id);

      // Step 3: Create Investment
      const investmentData = {
        structureId: structure.id,
        investmentName: 'Startup Investment',
        investmentType: 'EQUITY',
        equityInvested: 500000,
        ownershipPercentage: 10,
        userId: user.id,
      };

      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'investment-startup',
          structure_id: 'structure-fund',
          investment_name: 'Startup Investment',
          investment_type: 'EQUITY',
          equity_invested: 500000,
          ownership_percentage: 10,
          user_id: 'user-investor',
          status: 'Active',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const investment = await Investment.create(investmentData);
      expect(investment).toBeDefined();
      expect(investment.structureId).toBe(structure.id);
      expect(investment.userId).toBe(user.id);
    });

    test('should handle workflow with errors gracefully', async () => {
      // Create user successfully
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: 1,
        },
        error: null,
      });

      const user = await User.create({
        email: 'test@example.com',
        password: 'pass123',
        firstName: 'Test',
        role: 1,
      });

      expect(user).toBeDefined();

      // Structure creation fails
      mockSupabase.setMockResponse('structures', {
        data: null,
        error: { message: 'Insufficient permissions' },
      });

      await expect(
        Structure.create({
          name: 'Failed Fund',
          type: 'FUND',
          createdBy: user.id,
        })
      ).rejects.toThrow('Error creating structure');
    });
  });

  describe('Multi-User Investment Scenario', () => {
    test('should handle multiple investors in same structure', async () => {
      const structureId = 'structure-shared';

      // Create structure
      mockSupabase.setMockResponse('structures', {
        data: {
          id: structureId,
          name: 'Shared Fund',
          type: 'FUND',
          created_by: 'user-admin',
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const structure = await Structure.create({
        name: 'Shared Fund',
        type: 'FUND',
        createdBy: 'user-admin',
      });

      // Investor 1 invests
      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'inv-1',
          structure_id: structureId,
          user_id: 'user-investor-1',
          equity_invested: 100000,
        },
        error: null,
      });

      const investment1 = await Investment.create({
        structureId: structure.id,
        investmentName: 'Investment 1',
        investmentType: 'EQUITY',
        equityInvested: 100000,
        userId: 'user-investor-1',
      });

      // Investor 2 invests
      mockSupabase.setMockResponse('investments', {
        data: {
          id: 'inv-2',
          structure_id: structureId,
          user_id: 'user-investor-2',
          equity_invested: 200000,
        },
        error: null,
      });

      const investment2 = await Investment.create({
        structureId: structure.id,
        investmentName: 'Investment 2',
        investmentType: 'EQUITY',
        equityInvested: 200000,
        userId: 'user-investor-2',
      });

      // Verify both investments in same structure
      expect(investment1.structureId).toBe(structureId);
      expect(investment2.structureId).toBe(structureId);
      expect(investment1.userId).not.toBe(investment2.userId);
    });
  });

  describe('Investment Update Workflow', () => {
    test('should track investment performance over time', async () => {
      const investmentId = 'investment-tracking';

      // Create initial investment
      mockSupabase.setMockResponse('investments', {
        data: {
          id: investmentId,
          equity_invested: 100000,
          current_value: 100000,
          irr: 0,
          multiple: 1.0,
        },
        error: null,
      });

      const investment = await Investment.create({
        structureId: 'structure-123',
        investmentName: 'Growing Investment',
        investmentType: 'EQUITY',
        equityInvested: 100000,
        userId: 'user-123',
      });

      // Update after 6 months - value increased
      mockSupabase.setMockResponse('investments', {
        data: {
          id: investmentId,
          current_value: 120000,
          irr: 10.5,
          multiple: 1.2,
        },
        error: null,
      });

      const updated1 = await Investment.updatePerformanceMetrics(investmentId, {
        irrPercent: 10.5,
        moic: 1.2,
      });

      expect(updated1.multiple).toBe(1.2);

      // Exit investment
      mockSupabase.setMockResponse('investments', {
        data: {
          id: investmentId,
          status: 'Exited',
          exit_date: '2024-12-31',
          equity_exit_value: 150000,
        },
        error: null,
      });

      const exited = await Investment.markAsExited(investmentId, {
        exitDate: '2024-12-31',
        equityExitValue: 150000,
      });

      expect(exited.status).toBe('Exited');
      expect(exited.equityExitValue).toBe(150000);
    });
  });

  describe('Role-Based Access Workflow', () => {
    test('should enforce role-based access patterns', async () => {
      // Create ROOT user
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-root',
          email: 'root@example.com',
          role: 0, // ROOT
        },
        error: null,
      });

      const rootUser = await User.create({
        email: 'root@example.com',
        password: 'root123',
        firstName: 'Root',
        role: 0,
      });

      expect(rootUser.role).toBe(0);

      // Create INVESTOR user
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-investor',
          email: 'investor@example.com',
          role: 3, // INVESTOR
        },
        error: null,
      });

      const investorUser = await User.create({
        email: 'investor@example.com',
        password: 'investor123',
        firstName: 'Investor',
        role: 3,
      });

      expect(investorUser.role).toBe(3);

      // Root can create structures
      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-root',
          created_by: rootUser.id,
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const rootStructure = await Structure.create({
        name: 'Root Fund',
        type: 'FUND',
        createdBy: rootUser.id,
      });

      expect(rootStructure.createdBy).toBe(rootUser.id);
    });
  });
});
