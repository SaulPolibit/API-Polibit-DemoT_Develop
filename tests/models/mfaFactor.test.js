/**
 * MFAFactor Model Tests
 * Tests for src/models/supabase/mfaFactor.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const MFAFactor = require('../../src/models/supabase/mfaFactor');

describe('MFAFactor Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSupabase.reset();
  });

  describe('upsert', () => {
    test('should upsert a TOTP MFA factor', async () => {
      const mfaData = {
        userId: 'user-123',
        factorId: 'factor-123',
        factorType: 'totp',
        isActive: true,
      };

      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-123',
            user_id: 'user-123',
            factor_id: 'factor-123',
            factor_type: 'totp',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        error: null,
      });

      const result = await MFAFactor.upsert(mfaData);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.factorType).toBe('totp');
      expect(result.factorId).toBe('factor-123');
    });
  });

  describe('findByUserId', () => {
    test('should find all MFA factors for a user', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-1',
            user_id: 'user-123',
            factor_id: 'factor-1',
            factor_type: 'totp',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mfa-2',
            user_id: 'user-123',
            factor_id: 'factor-2',
            factor_type: 'webauthn',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const result = await MFAFactor.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-123');
    });

    test('should filter by active only', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-active',
            user_id: 'user-123',
            factor_id: 'factor-1',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const result = await MFAFactor.findByUserId('user-123', true);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('findByFactorId', () => {
    test('should find MFA factor by factor ID', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: {
          id: 'mfa-123',
          user_id: 'user-123',
          factor_id: 'factor-123',
          factor_type: 'totp',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await MFAFactor.findByFactorId('factor-123');

      expect(result).toBeDefined();
      expect(result.factorId).toBe('factor-123');
    });

    test('should return null if MFA factor not found', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await MFAFactor.findByFactorId('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateLastUsed', () => {
    test('should update last used timestamp', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: {
          id: 'mfa-123',
          factor_id: 'factor-123',
          user_id: 'user-123',
          factor_type: 'totp',
          is_active: true,
          last_used_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await MFAFactor.updateLastUsed('factor-123');

      expect(result).toBeDefined();
      expect(result.lastUsedAt).toBeDefined();
    });
  });

  describe('deactivate', () => {
    test('should deactivate MFA factor', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: {
          id: 'mfa-123',
          factor_id: 'factor-123',
          user_id: 'user-123',
          factor_type: 'totp',
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await MFAFactor.deactivate('factor-123');

      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    test('should delete MFA factor successfully', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: null,
        error: null,
      });

      const result = await MFAFactor.delete('factor-123');

      expect(result).toBe(true);
    });
  });

  describe('hasActiveMFA', () => {
    test('should return true if user has active MFA', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-active',
          },
        ],
        error: null,
      });

      const result = await MFAFactor.hasActiveMFA('user-123');

      expect(result).toBe(true);
    });

    test('should return false if user has no active MFA', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [],
        error: null,
      });

      const result = await MFAFactor.hasActiveMFA('user-123');

      expect(result).toBe(false);
    });
  });

  describe('Factor Types', () => {
    test('should handle TOTP factor type', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-totp',
            factor_id: 'factor-totp',
            factor_type: 'totp',
            user_id: 'user-123',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        error: null,
      });

      const result = await MFAFactor.upsert({
        userId: 'user-123',
        factorId: 'factor-totp',
        factorType: 'totp',
      });

      expect(result.factorType).toBe('totp');
    });

    test('should handle WebAuthn factor type', async () => {
      mockSupabase.setMockResponse('user_mfa_factors', {
        data: [
          {
            id: 'mfa-webauthn',
            factor_id: 'factor-webauthn',
            factor_type: 'webauthn',
            user_id: 'user-123',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        error: null,
      });

      const result = await MFAFactor.upsert({
        userId: 'user-123',
        factorId: 'factor-webauthn',
        factorType: 'webauthn',
      });

      expect(result.factorType).toBe('webauthn');
    });
  });
});
