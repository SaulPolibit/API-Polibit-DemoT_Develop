/**
 * Structure Model Tests
 * Tests for src/models/supabase/structure.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Structure = require('../../src/models/supabase/structure');

describe('Structure Model', () => {
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
    test('should create a structure successfully', async () => {
      const structureData = {
        name: 'Test Fund',
        type: 'FUND',
        description: 'Test fund description',
        baseCurrency: 'USD',
        createdBy: 'user-123',
        status: 'Active',
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          name: 'Test Fund',
          type: 'FUND',
          description: 'Test fund description',
          base_currency: 'USD',
          created_by: 'user-123',
          status: 'Active',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock investment count queries
      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.create(structureData);

      expect(result).toBeDefined();
      expect(result.id).toBe('structure-123');
      expect(result.name).toBe('Test Fund');
      expect(result.currentInvestors).toBe(0);
      expect(result.currentInvestments).toBe(0);
    });

    test('should handle structure creation with parent structure', async () => {
      const structureData = {
        name: 'Child Structure',
        type: 'SA_LLC',
        parentStructureId: 'parent-123',
        hierarchyLevel: 1,
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-child',
          name: 'Child Structure',
          type: 'SA_LLC',
          parent_structure_id: 'parent-123',
          hierarchy_level: 1,
          created_by: 'user-123',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.create(structureData);

      expect(result.parentStructureId).toBe('parent-123');
      expect(result.hierarchyLevel).toBe(1);
    });

    test('should throw error on database failure', async () => {
      const structureData = {
        name: 'Test Fund',
        type: 'FUND',
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('structures', {
        data: null,
        error: { message: 'Database error' },
      });

      await expect(Structure.create(structureData)).rejects.toThrow('Error creating structure');
    });
  });

  describe('findById', () => {
    test('should find structure by ID', async () => {
      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          name: 'Test Fund',
          type: 'FUND',
          created_by: 'user-123',
          base_currency: 'USD',
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [
          { id: 'inv-1', user_id: 'user-1' },
          { id: 'inv-2', user_id: 'user-2' },
        ],
        error: null,
      });

      const result = await Structure.findById('structure-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('structure-123');
      expect(result.name).toBe('Test Fund');
      expect(result.currentInvestments).toBe(2);
      expect(result.currentInvestors).toBe(2);
    });

    test('should return null if structure not found', async () => {
      mockSupabase.setMockResponse('structures', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await Structure.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    test('should find structures with filters', async () => {
      mockSupabase.setMockResponse('structures', {
        data: [
          {
            id: 'structure-1',
            name: 'Fund 1',
            type: 'FUND',
            created_by: 'user-123',
          },
          {
            id: 'structure-2',
            name: 'Fund 2',
            type: 'FUND',
            created_by: 'user-123',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.find({ createdBy: 'user-123' });

      expect(result).toHaveLength(2);
    });

    test('should find all structures without filters', async () => {
      mockSupabase.setMockResponse('structures', {
        data: [
          { id: 'structure-1', name: 'Fund 1', type: 'FUND', created_by: 'user-1' },
          { id: 'structure-2', name: 'Fund 2', type: 'SA_LLC', created_by: 'user-2' },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.find();

      expect(result).toHaveLength(2);
    });
  });

  describe('findByUserId', () => {
    test('should find structures by user ID', async () => {
      mockSupabase.setMockResponse('structures', {
        data: [
          { id: 'structure-1', name: 'User Fund', created_by: 'user-123' },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.findByUserId('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].createdBy).toBe('user-123');
    });
  });

  describe('findChildStructures', () => {
    test('should find child structures', async () => {
      mockSupabase.setMockResponse('structures', {
        data: [
          {
            id: 'child-1',
            name: 'Child 1',
            parent_structure_id: 'parent-123',
          },
          {
            id: 'child-2',
            name: 'Child 2',
            parent_structure_id: 'parent-123',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.findChildStructures('parent-123');

      expect(result).toHaveLength(2);
      expect(result[0].parentStructureId).toBe('parent-123');
    });
  });

  describe('findRootStructures', () => {
    test('should find root structures for user', async () => {
      mockSupabase.setMockResponse('structures', {
        data: [
          {
            id: 'root-1',
            name: 'Root Fund',
            created_by: 'user-123',
            parent_structure_id: null,
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.findRootStructures('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].parentStructureId).toBeNull();
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update structure successfully', async () => {
      const updateData = {
        name: 'Updated Fund Name',
        description: 'Updated description',
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          name: 'Updated Fund Name',
          description: 'Updated description',
          type: 'FUND',
          created_by: 'user-123',
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.findByIdAndUpdate('structure-123', updateData);

      expect(result.name).toBe('Updated Fund Name');
      expect(result.description).toBe('Updated description');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('structures', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        Structure.findByIdAndUpdate('structure-123', { name: 'New Name' })
      ).rejects.toThrow('Error updating structure');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete structure successfully', async () => {
      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          name: 'Deleted Fund',
          type: 'FUND',
          created_by: 'user-123',
        },
        error: null,
      });

      const result = await Structure.findByIdAndDelete('structure-123');

      expect(result.id).toBe('structure-123');
    });

    test('should throw error if delete fails', async () => {
      mockSupabase.setMockResponse('structures', {
        data: null,
        error: { message: 'Delete failed' },
      });

      await expect(Structure.findByIdAndDelete('structure-123')).rejects.toThrow('Error deleting structure');
    });
  });

  describe('updateFinancials', () => {
    test('should update financial totals', async () => {
      const financials = {
        totalCalled: 1000000,
        totalDistributed: 500000,
        totalInvested: 800000,
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          total_called: 1000000,
          total_distributed: 500000,
          total_invested: 800000,
          name: 'Test Fund',
          type: 'FUND',
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.updateFinancials('structure-123', financials);

      expect(result.totalCalled).toBe(1000000);
      expect(result.totalDistributed).toBe(500000);
      expect(result.totalInvested).toBe(800000);
    });
  });

  describe('getInvestorCount', () => {
    test('should count unique investors', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [
          { id: 'inv-1', user_id: 'user-1' },
          { id: 'inv-2', user_id: 'user-2' },
          { id: 'inv-3', user_id: 'user-1' }, // Duplicate user
        ],
        error: null,
      });

      const count = await Structure.getInvestorCount('structure-123');

      expect(count).toBe(2); // Only 2 unique users
    });

    test('should handle errors gracefully', async () => {
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: { message: 'Query failed' },
      });

      const count = await Structure.getInvestorCount('structure-123');

      expect(count).toBe(0);
    });
  });

  describe('getInvestmentCount', () => {
    test('should count total investments', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [
          { id: 'inv-1' },
          { id: 'inv-2' },
          { id: 'inv-3' },
        ],
        error: null,
      });

      const count = await Structure.getInvestmentCount('structure-123');

      expect(count).toBe(3);
    });

    test('should return 0 for empty results', async () => {
      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const count = await Structure.getInvestmentCount('structure-123');

      expect(count).toBe(0);
    });
  });

  describe('Field Mapping', () => {
    test('should correctly map camelCase to snake_case', async () => {
      const structureData = {
        name: 'Test',
        baseCurrency: 'USD',
        totalCommitment: 1000000,
        managementFee: 2.5,
        carriedInterest: 20,
        inceptionDate: '2024-01-01',
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('structures', {
        data: {
          id: 'structure-123',
          name: 'Test',
          base_currency: 'USD',
          total_commitment: 1000000,
          management_fee: 2.5,
          carried_interest: 20,
          inception_date: '2024-01-01',
          created_by: 'user-123',
        },
        error: null,
      });

      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      const result = await Structure.create(structureData);

      expect(result.baseCurrency).toBe('USD');
      expect(result.totalCommitment).toBe(1000000);
    });
  });
});
