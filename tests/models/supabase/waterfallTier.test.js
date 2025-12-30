/**
 * Tests for WaterfallTier Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const WaterfallTier = require('../../../src/models/supabase/waterfallTier');

describe('WaterfallTier Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create waterfall tier successfully', async () => {
      const dbResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        threshold_amount: null,
        threshold_irr: null,
        description: '100% to LPs',
        is_active: true,
        user_id: 'user-789',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.create({
        structureId: 'struct-456',
        tierNumber: 1,
        tierName: 'Return of Capital',
        lpSharePercent: 100,
        gpSharePercent: 0,
        description: '100% to LPs',
        isActive: true,
        userId: 'user-789'
      });

      expect(result.id).toBe('tier-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.tierNumber).toBe(1);
      expect(result.tierName).toBe('Return of Capital');
      expect(result.lpSharePercent).toBe(100);
      expect(result.gpSharePercent).toBe(0);
      expect(result.isActive).toBe(true);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.create({
        structureId: 'struct-456',
        tierNumber: 1
      })).rejects.toThrow('Error creating waterfall tier');
    });
  });

  describe('findById', () => {
    test('should find waterfall tier by ID', async () => {
      const dbResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 2,
        tier_name: 'Preferred Return',
        lp_share_percent: 100,
        gp_share_percent: 0,
        threshold_amount: null,
        threshold_irr: 8,
        description: 'Hurdle rate',
        is_active: true,
        user_id: 'user-789',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findById('tier-123');

      expect(result.id).toBe('tier-123');
      expect(result.tierNumber).toBe(2);
      expect(result.thresholdIrr).toBe(8);
    });

    test('should return null if tier not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      const result = await WaterfallTier.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.findById('tier-123')).rejects.toThrow('Error finding waterfall tier');
    });
  });

  describe('find', () => {
    test('should find tiers with filter', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: 8,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.find({ structureId: 'struct-456' });

      expect(result).toHaveLength(2);
      expect(result[0].tierNumber).toBe(1);
      expect(result[1].tierNumber).toBe(2);
    });

    test('should return empty array if no tiers match', async () => {
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: [],
        error: null
      });

      const result = await WaterfallTier.find({ structureId: 'no-tiers' });
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.find({ structureId: 'struct-456' }))
        .rejects.toThrow('Error finding waterfall tiers');
    });
  });

  describe('findByStructureId', () => {
    test('should find all tiers for a structure', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findByStructureId('struct-456');

      expect(result).toHaveLength(2);
      expect(result[0].structureId).toBe('struct-456');
      expect(result[1].structureId).toBe('struct-456');
    });
  });

  describe('findActiveByStructureId', () => {
    test('should find only active tiers for a structure', async () => {
      const dbResponse = [
        {
          id: 'tier-active',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findActiveByStructureId('struct-456');

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('findByUserId', () => {
    test('should find tiers by user ID', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-1',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          user_id: 'user-789',
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findByUserId('user-789');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-789');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update waterfall tier successfully', async () => {
      // Mock findById call
      const existingResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true
      };

      const updatedResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Updated Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        description: 'Updated description',
        is_active: true,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: existingResponse,
        error: null
      });

      const result1 = await WaterfallTier.findById('tier-123');
      expect(result1).toBeTruthy();

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: updatedResponse,
        error: null
      });

      const result = await WaterfallTier.findByIdAndUpdate('tier-123', {
        tierName: 'Updated Return of Capital',
        description: 'Updated description'
      });

      expect(result.id).toBe('tier-123');
      expect(result.tierName).toBe('Updated Return of Capital');
      expect(result.description).toBe('Updated description');
    });

    test('should throw error if tier not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.findByIdAndUpdate('nonexistent-id', { tierName: 'New Name' }))
        .rejects.toThrow('Waterfall tier not found');
    });

    test('should throw error if update fails', async () => {
      const existingResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        is_active: true
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: existingResponse,
        error: null
      });

      await WaterfallTier.findById('tier-123');

      const error = new Error('Update failed');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.findByIdAndUpdate('tier-123', { tierName: 'New Name' }))
        .rejects.toThrow('Error finding waterfall tier');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete waterfall tier successfully', async () => {
      const dbResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: false
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findByIdAndDelete('tier-123');

      expect(result.id).toBe('tier-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.findByIdAndDelete('tier-123'))
        .rejects.toThrow('Error deleting waterfall tier');
    });
  });

  describe('createDefaultTiers', () => {
    test('should create default waterfall tiers with default parameters', async () => {
      const createdTiers = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: 8,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-3',
          structure_id: 'struct-456',
          tier_number: 3,
          tier_name: 'GP Catch-up',
          lp_share_percent: 0,
          gp_share_percent: 100,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-4',
          structure_id: 'struct-456',
          tier_number: 4,
          tier_name: 'Carried Interest',
          lp_share_percent: 80,
          gp_share_percent: 20,
          is_active: true,
          user_id: 'user-789'
        }
      ];

      // Create a queue of responses
      const responseQueue = [
        { data: [], error: null }, // findByStructureId returns empty
        ...createdTiers.map(tier => ({ data: tier, error: null })) // creates return tiers
      ];

      let callCount = 0;
      const originalFrom = mockSupabase.from.bind(mockSupabase);
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        const query = originalFrom(table);
        const response = responseQueue[callCount++];
        if (response) {
          query.mockData = response.data;
          query.mockError = response.error;
        }
        return query;
      });

      const result = await WaterfallTier.createDefaultTiers('struct-456', 8, 20, 'user-789');

      expect(result).toHaveLength(4);
      expect(result[0].tierName).toBe('Return of Capital');
      expect(result[0].lpSharePercent).toBe(100);
      expect(result[1].tierName).toBe('Preferred Return');
      expect(result[1].thresholdIrr).toBe(8);
      expect(result[2].tierName).toBe('GP Catch-up');
      expect(result[2].gpSharePercent).toBe(100);
      expect(result[3].tierName).toBe('Carried Interest');
      expect(result[3].gpSharePercent).toBe(20);
    });

    test('should create default tiers with custom hurdle and carry', async () => {
      const customTiers = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: 10,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-3',
          structure_id: 'struct-456',
          tier_number: 3,
          tier_name: 'GP Catch-up',
          lp_share_percent: 0,
          gp_share_percent: 100,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-4',
          structure_id: 'struct-456',
          tier_number: 4,
          tier_name: 'Carried Interest',
          lp_share_percent: 75,
          gp_share_percent: 25,
          is_active: true,
          user_id: 'user-789'
        }
      ];

      // Create a queue of responses
      const responseQueue = [
        { data: [], error: null }, // findByStructureId returns empty
        ...customTiers.map(tier => ({ data: tier, error: null })) // creates return tiers
      ];

      let callCount = 0;
      const originalFrom = mockSupabase.from.bind(mockSupabase);
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        const query = originalFrom(table);
        const response = responseQueue[callCount++];
        if (response) {
          query.mockData = response.data;
          query.mockError = response.error;
        }
        return query;
      });

      const result = await WaterfallTier.createDefaultTiers('struct-456', 10, 25, 'user-789');

      expect(result).toHaveLength(4);
      expect(result[1].thresholdIrr).toBe(10);
      expect(result[3].gpSharePercent).toBe(25);
      expect(result[3].lpSharePercent).toBe(75);
    });

    test('should throw error if tiers already exist', async () => {
      const existingTiers = [
        {
          id: 'tier-existing',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Existing Tier',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: existingTiers,
        error: null
      });

      await expect(WaterfallTier.createDefaultTiers('struct-456', 8, 20, 'user-789'))
        .rejects.toThrow('Waterfall tiers already exist for this structure');
    });
  });

  describe('validateTier', () => {
    test('should validate correct tier configuration', () => {
      const tier = {
        tierNumber: 1,
        lpSharePercent: 100,
        gpSharePercent: 0,
        thresholdIrr: null,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should invalidate tier with incorrect tier number', () => {
      const tier = {
        tierNumber: 5,
        lpSharePercent: 100,
        gpSharePercent: 0,
        thresholdIrr: null,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tier number must be between 1 and 4');
    });

    test('should invalidate tier with incorrect percentage sum', () => {
      const tier = {
        tierNumber: 1,
        lpSharePercent: 80,
        gpSharePercent: 10,
        thresholdIrr: null,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LP share and GP share must sum to 100%');
    });

    test('should invalidate tier with negative LP share', () => {
      const tier = {
        tierNumber: 1,
        lpSharePercent: -10,
        gpSharePercent: 110,
        thresholdIrr: null,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LP share must be between 0 and 100');
    });

    test('should invalidate tier with excessive GP share', () => {
      const tier = {
        tierNumber: 1,
        lpSharePercent: -50,
        gpSharePercent: 150,
        thresholdIrr: null,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GP share must be between 0 and 100');
    });

    test('should invalidate tier with invalid threshold IRR', () => {
      const tier = {
        tierNumber: 2,
        lpSharePercent: 100,
        gpSharePercent: 0,
        thresholdIrr: 150,
        thresholdAmount: null
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Threshold IRR must be between 0 and 100');
    });

    test('should invalidate tier with negative threshold amount', () => {
      const tier = {
        tierNumber: 2,
        lpSharePercent: 100,
        gpSharePercent: 0,
        thresholdIrr: null,
        thresholdAmount: -1000
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Threshold amount must be positive');
    });

    test('should accumulate multiple validation errors', () => {
      const tier = {
        tierNumber: 5,
        lpSharePercent: 150,
        gpSharePercent: -50,
        thresholdIrr: 200,
        thresholdAmount: -1000
      };

      const result = WaterfallTier.validateTier(tier);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('getWaterfallSummary', () => {
    test('should get waterfall summary for structure', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: null,
          threshold_amount: null,
          is_active: true
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: 8,
          threshold_amount: null,
          is_active: true
        },
        {
          id: 'tier-3',
          structure_id: 'struct-456',
          tier_number: 3,
          tier_name: 'GP Catch-up',
          lp_share_percent: 0,
          gp_share_percent: 100,
          threshold_irr: null,
          threshold_amount: null,
          is_active: true
        },
        {
          id: 'tier-4',
          structure_id: 'struct-456',
          tier_number: 4,
          tier_name: 'Carried Interest',
          lp_share_percent: 80,
          gp_share_percent: 20,
          threshold_irr: null,
          threshold_amount: null,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.getWaterfallSummary('struct-456');

      expect(result.structureId).toBe('struct-456');
      expect(result.totalTiers).toBe(4);
      expect(result.tiers).toHaveLength(4);
      expect(result.tiers[0].tierNumber).toBe(1);
      expect(result.tiers[0].lpShare).toBe(100);
      expect(result.tiers[0].threshold).toBe('None');
      expect(result.tiers[1].threshold).toBe('8% IRR');
    });

    test('should handle threshold amount in summary', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: null,
          threshold_amount: 1000000,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.getWaterfallSummary('struct-456');

      expect(result.tiers[0].threshold).toBe('$1000000');
    });
  });

  describe('deactivateAllTiers', () => {
    test('should deactivate all tiers for a structure', async () => {
      const dbResponse = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: false
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: false
        }
      ];

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.deactivateAllTiers('struct-456');

      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(false);
      expect(result[1].isActive).toBe(false);
    });

    test('should throw error if deactivation fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: null,
        error: error
      });

      await expect(WaterfallTier.deactivateAllTiers('struct-456'))
        .rejects.toThrow('Error deactivating tiers');
    });
  });

  describe('bulkUpdateTiers', () => {
    test('should update existing tiers', async () => {
      const existingTier = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true
      };

      const updatedTier = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Updated Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true
      };

      // Mock findById for update validation
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: existingTier,
        error: null
      });

      await WaterfallTier.findById('tier-123');

      // Mock update
      mockSupabase.setMockResponse('waterfall_tiers', {
        data: updatedTier,
        error: null
      });

      const result = await WaterfallTier.bulkUpdateTiers('struct-456', [
        {
          id: 'tier-123',
          tierName: 'Updated Return of Capital'
        }
      ], 'user-789');

      expect(result).toHaveLength(1);
      expect(result[0].tierName).toBe('Updated Return of Capital');
    });

    test('should create new tiers without ID', async () => {
      const newTier = {
        id: 'tier-new',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'New Tier',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true,
        user_id: 'user-789'
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: newTier,
        error: null
      });

      const result = await WaterfallTier.bulkUpdateTiers('struct-456', [
        {
          tierNumber: 1,
          tierName: 'New Tier',
          lpSharePercent: 100,
          gpSharePercent: 0
        }
      ], 'user-789');

      expect(result).toHaveLength(1);
      expect(result[0].tierName).toBe('New Tier');
      expect(result[0].userId).toBe('user-789');
    });

    test('should throw error if new tier missing required fields', async () => {
      await expect(WaterfallTier.bulkUpdateTiers('struct-456', [
        {
          tierName: 'Missing Fields'
          // Missing tierNumber, lpSharePercent, gpSharePercent
        }
      ], 'user-789')).rejects.toThrow('tierNumber is required for new tiers');
    });

    test('should throw error if new tier missing share percentages', async () => {
      await expect(WaterfallTier.bulkUpdateTiers('struct-456', [
        {
          tierNumber: 1,
          tierName: 'Missing Shares'
          // Missing lpSharePercent, gpSharePercent
        }
      ], 'user-789')).rejects.toThrow('lpSharePercent and gpSharePercent are required for new tiers');
    });

    test('should handle mixed update and create operations', async () => {
      // Mock existing tier (for findById during update)
      const existingTier = {
        id: 'tier-existing',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Existing Tier',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true
      };

      // Mock updated existing tier
      const updatedExisting = {
        id: 'tier-existing',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Updated Existing',
        lp_share_percent: 100,
        gp_share_percent: 0,
        is_active: true
      };

      // Mock new tier
      const newTier = {
        id: 'tier-new',
        structure_id: 'struct-456',
        tier_number: 2,
        tier_name: 'New Tier',
        lp_share_percent: 80,
        gp_share_percent: 20,
        is_active: true,
        user_id: 'user-789'
      };

      // Create a queue of responses in order:
      // 1. findById for existing tier
      // 2. update existing tier
      // 3. create new tier
      const responseQueue = [
        { data: existingTier, error: null },
        { data: updatedExisting, error: null },
        { data: newTier, error: null }
      ];

      let callCount = 0;
      const originalFrom = mockSupabase.from.bind(mockSupabase);
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        const query = originalFrom(table);
        const response = responseQueue[callCount++];
        if (response) {
          query.mockData = response.data;
          query.mockError = response.error;
        }
        return query;
      });

      const result = await WaterfallTier.bulkUpdateTiers('struct-456', [
        {
          id: 'tier-existing',
          tierName: 'Updated Existing'
        },
        {
          tierNumber: 2,
          tierName: 'New Tier',
          lpSharePercent: 80,
          gpSharePercent: 20
        }
      ], 'user-789');

      expect(result).toHaveLength(2);
      expect(result[0].tierName).toBe('Updated Existing');
      expect(result[1].tierName).toBe('New Tier');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'tier-123',
        structure_id: 'struct-456',
        tier_number: 1,
        tier_name: 'Return of Capital',
        lp_share_percent: 100,
        gp_share_percent: 0,
        threshold_amount: 1000000,
        threshold_irr: 8,
        description: 'Tier description',
        is_active: true,
        user_id: 'user-789',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('waterfall_tiers', {
        data: dbResponse,
        error: null
      });

      const result = await WaterfallTier.findById('tier-123');

      expect(result.structureId).toBe('struct-456');
      expect(result.tierNumber).toBe(1);
      expect(result.tierName).toBe('Return of Capital');
      expect(result.lpSharePercent).toBe(100);
      expect(result.gpSharePercent).toBe(0);
      expect(result.thresholdAmount).toBe(1000000);
      expect(result.thresholdIrr).toBe(8);
      expect(result.isActive).toBe(true);
      expect(result.userId).toBe('user-789');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('Waterfall tier scenarios', () => {
    test('should handle standard 4-tier waterfall structure', async () => {
      const tiers = [
        {
          id: 'tier-1',
          structure_id: 'struct-456',
          tier_number: 1,
          tier_name: 'Return of Capital',
          lp_share_percent: 100,
          gp_share_percent: 0,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-2',
          structure_id: 'struct-456',
          tier_number: 2,
          tier_name: 'Preferred Return',
          lp_share_percent: 100,
          gp_share_percent: 0,
          threshold_irr: 8,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-3',
          structure_id: 'struct-456',
          tier_number: 3,
          tier_name: 'GP Catch-up',
          lp_share_percent: 0,
          gp_share_percent: 100,
          is_active: true,
          user_id: 'user-789'
        },
        {
          id: 'tier-4',
          structure_id: 'struct-456',
          tier_number: 4,
          tier_name: 'Carried Interest',
          lp_share_percent: 80,
          gp_share_percent: 20,
          is_active: true,
          user_id: 'user-789'
        }
      ];

      // Create a queue of responses
      const responseQueue = [
        { data: [], error: null }, // findByStructureId returns empty
        ...tiers.map(tier => ({ data: tier, error: null })) // creates return tiers
      ];

      let callCount = 0;
      const originalFrom = mockSupabase.from.bind(mockSupabase);
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        const query = originalFrom(table);
        const response = responseQueue[callCount++];
        if (response) {
          query.mockData = response.data;
          query.mockError = response.error;
        }
        return query;
      });

      const result = await WaterfallTier.createDefaultTiers('struct-456', 8, 20, 'user-789');

      expect(result).toHaveLength(4);
      expect(result[0].lpSharePercent).toBe(100);
      expect(result[0].gpSharePercent).toBe(0);
      expect(result[1].thresholdIrr).toBe(8);
      expect(result[2].gpSharePercent).toBe(100);
      expect(result[3].lpSharePercent + result[3].gpSharePercent).toBe(100);
    });
  });
});
