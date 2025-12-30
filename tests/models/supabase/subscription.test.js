/**
 * Tests for Subscription Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Subscription = require('../../../src/models/supabase/subscription');

describe('Subscription Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create subscription with full data successfully', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '50000.00',
        currency: 'USD',
        status: 'pending',
        payment_id: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.create({
        structureId: 'struct-456',
        userId: 'user-789',
        fundId: 'fund-101',
        requestedAmount: '50000.00',
        currency: 'USD',
        status: 'pending'
      });

      expect(result.id).toBe('sub-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.fundId).toBe('fund-101');
      expect(result.requestedAmount).toBe('50000.00');
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('pending');
    });

    test('should create subscription with minimal data', async () => {
      const dbResponse = {
        id: 'sub-minimal',
        structure_id: 'struct-123',
        user_id: 'user-456',
        requested_amount: '10000.00',
        currency: 'USD',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.create({
        structureId: 'struct-123',
        userId: 'user-456',
        requestedAmount: '10000.00',
        currency: 'USD',
        status: 'pending'
      });

      expect(result.id).toBe('sub-minimal');
      expect(result.structureId).toBe('struct-123');
      expect(result.userId).toBe('user-456');
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.create({
        structureId: 'struct-123',
        userId: 'user-456'
      })).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find subscription by ID successfully', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '25000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-123',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findById('sub-123');

      expect(result.id).toBe('sub-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.status).toBe('approved');
      expect(result.paymentId).toBe('payment-123');
    });

    test('should return null if subscription not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      const result = await Subscription.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findById('sub-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    test('should find all subscriptions for a user', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-1',
          user_id: 'user-123',
          fund_id: 'fund-1',
          requested_amount: '10000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-2',
          user_id: 'user-123',
          fund_id: 'fund-2',
          requested_amount: '20000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sub-1');
      expect(result[0].userId).toBe('user-123');
      expect(result[0].status).toBe('approved');
      expect(result[1].id).toBe('sub-2');
      expect(result[1].userId).toBe('user-123');
      expect(result[1].status).toBe('pending');
    });

    test('should return empty array if user has no subscriptions', async () => {
      mockSupabase.setMockResponse('subscriptions', {
        data: [],
        error: null
      });

      const result = await Subscription.findByUserId('user-no-subs');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByUserId('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByStructureId', () => {
    test('should find all subscriptions for a structure', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-456',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '15000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-456',
          user_id: 'user-2',
          fund_id: 'fund-1',
          requested_amount: '25000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByStructureId('struct-456');

      expect(result).toHaveLength(2);
      expect(result[0].structureId).toBe('struct-456');
      expect(result[1].structureId).toBe('struct-456');
    });

    test('should return empty array if structure has no subscriptions', async () => {
      mockSupabase.setMockResponse('subscriptions', {
        data: [],
        error: null
      });

      const result = await Subscription.findByStructureId('struct-empty');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByStructureId('struct-456')).rejects.toThrow('Database error');
    });
  });

  describe('findByFundId', () => {
    test('should find all subscriptions for a fund', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-1',
          user_id: 'user-1',
          fund_id: 'fund-789',
          requested_amount: '30000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-2',
          user_id: 'user-2',
          fund_id: 'fund-789',
          requested_amount: '40000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-2',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByFundId('fund-789');

      expect(result).toHaveLength(2);
      expect(result[0].fundId).toBe('fund-789');
      expect(result[1].fundId).toBe('fund-789');
    });

    test('should return empty array if fund has no subscriptions', async () => {
      mockSupabase.setMockResponse('subscriptions', {
        data: [],
        error: null
      });

      const result = await Subscription.findByFundId('fund-empty');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByFundId('fund-789')).rejects.toThrow('Database error');
    });
  });

  describe('findByPaymentId', () => {
    test('should find subscription by payment ID', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '12000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-999',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByPaymentId('payment-999');

      expect(result.id).toBe('sub-123');
      expect(result.paymentId).toBe('payment-999');
      expect(result.status).toBe('approved');
    });

    test('should return null if payment ID not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      const result = await Subscription.findByPaymentId('payment-nonexistent');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByPaymentId('payment-999')).rejects.toThrow('Database error');
    });
  });

  describe('findByStatus', () => {
    test('should find all pending subscriptions', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-1',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '5000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-2',
          user_id: 'user-2',
          fund_id: 'fund-2',
          requested_amount: '7000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByStatus('pending');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });

    test('should find all approved subscriptions', async () => {
      const dbResponse = [
        {
          id: 'sub-approved',
          structure_id: 'struct-1',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '8000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByStatus('approved');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
      expect(result[0].paymentId).toBe('payment-1');
    });

    test('should find all rejected subscriptions', async () => {
      const dbResponse = [
        {
          id: 'sub-rejected',
          structure_id: 'struct-1',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '3000.00',
          currency: 'USD',
          status: 'rejected',
          payment_id: null,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByStatus('rejected');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('rejected');
    });

    test('should return empty array if no subscriptions match status', async () => {
      mockSupabase.setMockResponse('subscriptions', {
        data: [],
        error: null
      });

      const result = await Subscription.findByStatus('completed');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByStatus('pending')).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    test('should find subscriptions with single criteria', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-123',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '10000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.find({ structureId: 'struct-123' });

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('struct-123');
    });

    test('should find subscriptions with multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'sub-match',
          structure_id: 'struct-123',
          user_id: 'user-456',
          fund_id: 'fund-789',
          requested_amount: '15000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-123',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.find({
        structureId: 'struct-123',
        userId: 'user-456',
        status: 'approved'
      });

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('struct-123');
      expect(result[0].userId).toBe('user-456');
      expect(result[0].status).toBe('approved');
    });

    test('should return all subscriptions when no criteria provided', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-1',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '5000.00',
          currency: 'USD',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-2',
          user_id: 'user-2',
          fund_id: 'fund-2',
          requested_amount: '6000.00',
          currency: 'USD',
          status: 'approved',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.find();

      expect(result).toHaveLength(2);
    });

    test('should return empty array if no subscriptions match', async () => {
      mockSupabase.setMockResponse('subscriptions', {
        data: [],
        error: null
      });

      const result = await Subscription.find({ status: 'unknown' });
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.find({ status: 'pending' })).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update subscription successfully', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '20000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-new',
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByIdAndUpdate('sub-123', {
        status: 'approved',
        paymentId: 'payment-new'
      });

      expect(result.id).toBe('sub-123');
      expect(result.status).toBe('approved');
      expect(result.paymentId).toBe('payment-new');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByIdAndUpdate('sub-123', { status: 'approved' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete subscription successfully', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '10000.00',
        currency: 'USD',
        status: 'pending'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByIdAndDelete('sub-123');

      expect(result.id).toBe('sub-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('subscriptions', {
        data: null,
        error: error
      });

      await expect(Subscription.findByIdAndDelete('sub-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('updateStatus', () => {
    test('should update subscription status to approved', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '15000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-123',
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.updateStatus('sub-123', 'approved');

      expect(result.id).toBe('sub-123');
      expect(result.status).toBe('approved');
    });

    test('should update subscription status to rejected', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '8000.00',
        currency: 'USD',
        status: 'rejected',
        payment_id: null,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.updateStatus('sub-123', 'rejected');

      expect(result.id).toBe('sub-123');
      expect(result.status).toBe('rejected');
    });
  });

  describe('updatePaymentId', () => {
    test('should update payment ID successfully', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '12000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-updated',
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.updatePaymentId('sub-123', 'payment-updated');

      expect(result.id).toBe('sub-123');
      expect(result.paymentId).toBe('payment-updated');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'sub-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        fund_id: 'fund-101',
        requested_amount: '25000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findById('sub-123');

      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.fundId).toBe('fund-101');
      expect(result.requestedAmount).toBe('25000.00');
      expect(result.paymentId).toBe('payment-123');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('Currency handling', () => {
    test('should handle USD currency', async () => {
      const dbResponse = {
        id: 'sub-usd',
        structure_id: 'struct-456',
        user_id: 'user-789',
        requested_amount: '10000.00',
        currency: 'USD',
        status: 'pending'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findById('sub-usd');

      expect(result.currency).toBe('USD');
      expect(result.requestedAmount).toBe('10000.00');
    });

    test('should handle MXN currency', async () => {
      const dbResponse = {
        id: 'sub-mxn',
        structure_id: 'struct-456',
        user_id: 'user-789',
        requested_amount: '180000.00',
        currency: 'MXN',
        status: 'pending'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findById('sub-mxn');

      expect(result.currency).toBe('MXN');
      expect(result.requestedAmount).toBe('180000.00');
    });

    test('should handle EUR currency', async () => {
      const dbResponse = {
        id: 'sub-eur',
        structure_id: 'struct-456',
        user_id: 'user-789',
        requested_amount: '8500.00',
        currency: 'EUR',
        status: 'pending'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findById('sub-eur');

      expect(result.currency).toBe('EUR');
    });
  });

  describe('Subscription workflow scenarios', () => {
    test('should handle complete subscription approval workflow', async () => {
      // Create subscription
      const createResponse = {
        id: 'sub-workflow',
        structure_id: 'struct-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: '50000.00',
        currency: 'USD',
        status: 'pending',
        payment_id: null,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: createResponse,
        error: null
      });

      const created = await Subscription.create({
        structureId: 'struct-123',
        userId: 'user-456',
        fundId: 'fund-789',
        requestedAmount: '50000.00',
        currency: 'USD',
        status: 'pending'
      });

      expect(created.status).toBe('pending');
      expect(created.paymentId).toBeNull();

      // Update payment ID
      const paymentResponse = {
        id: 'sub-workflow',
        structure_id: 'struct-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: '50000.00',
        currency: 'USD',
        status: 'pending',
        payment_id: 'payment-new',
        updated_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: paymentResponse,
        error: null
      });

      const withPayment = await Subscription.updatePaymentId('sub-workflow', 'payment-new');
      expect(withPayment.paymentId).toBe('payment-new');

      // Approve subscription
      const approvedResponse = {
        id: 'sub-workflow',
        structure_id: 'struct-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: '50000.00',
        currency: 'USD',
        status: 'approved',
        payment_id: 'payment-new',
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: approvedResponse,
        error: null
      });

      const approved = await Subscription.updateStatus('sub-workflow', 'approved');
      expect(approved.status).toBe('approved');
      expect(approved.paymentId).toBe('payment-new');
    });

    test('should handle subscription rejection workflow', async () => {
      // Create subscription
      const createResponse = {
        id: 'sub-reject',
        structure_id: 'struct-123',
        user_id: 'user-456',
        requested_amount: '5000.00',
        currency: 'USD',
        status: 'pending',
        payment_id: null,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: createResponse,
        error: null
      });

      const created = await Subscription.create({
        structureId: 'struct-123',
        userId: 'user-456',
        requestedAmount: '5000.00',
        currency: 'USD',
        status: 'pending'
      });

      expect(created.status).toBe('pending');

      // Reject subscription
      const rejectedResponse = {
        id: 'sub-reject',
        structure_id: 'struct-123',
        user_id: 'user-456',
        requested_amount: '5000.00',
        currency: 'USD',
        status: 'rejected',
        payment_id: null,
        updated_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('subscriptions', {
        data: rejectedResponse,
        error: null
      });

      const rejected = await Subscription.updateStatus('sub-reject', 'rejected');
      expect(rejected.status).toBe('rejected');
    });
  });

  describe('Multi-subscription scenarios', () => {
    test('should handle user with multiple subscriptions across different structures', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-1',
          user_id: 'user-multi',
          fund_id: 'fund-1',
          requested_amount: '10000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-2',
          user_id: 'user-multi',
          fund_id: 'fund-2',
          requested_amount: '20000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-14T10:00:00Z'
        },
        {
          id: 'sub-3',
          structure_id: 'struct-3',
          user_id: 'user-multi',
          fund_id: 'fund-3',
          requested_amount: '15000.00',
          currency: 'USD',
          status: 'rejected',
          payment_id: null,
          created_at: '2024-01-13T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByUserId('user-multi');

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('approved');
      expect(result[1].status).toBe('pending');
      expect(result[2].status).toBe('rejected');
    });

    test('should handle structure with multiple subscriptions from different users', async () => {
      const dbResponse = [
        {
          id: 'sub-1',
          structure_id: 'struct-popular',
          user_id: 'user-1',
          fund_id: 'fund-1',
          requested_amount: '25000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-1',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sub-2',
          structure_id: 'struct-popular',
          user_id: 'user-2',
          fund_id: 'fund-1',
          requested_amount: '30000.00',
          currency: 'USD',
          status: 'approved',
          payment_id: 'payment-2',
          created_at: '2024-01-14T10:00:00Z'
        },
        {
          id: 'sub-3',
          structure_id: 'struct-popular',
          user_id: 'user-3',
          fund_id: 'fund-1',
          requested_amount: '15000.00',
          currency: 'USD',
          status: 'pending',
          payment_id: null,
          created_at: '2024-01-13T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await Subscription.findByStructureId('struct-popular');

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe('user-1');
      expect(result[1].userId).toBe('user-2');
      expect(result[2].userId).toBe('user-3');
    });
  });
});
