/**
 * Payment Model Tests
 * Tests for src/models/supabase/payment.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Payment = require('../../src/models/supabase/payment');

describe('Payment Model', () => {
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
    test('should create a payment successfully', async () => {
      const paymentData = {
        submissionId: 'submission-123',
        userId: 'user-123',
        amount: 1000.00,
        status: 'pending',
        paymentMethod: 'stripe',
      };

      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          submission_id: 'submission-123',
          user_id: 'user-123',
          amount: 1000.00,
          status: 'pending',
          payment_method: 'stripe',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Payment.create(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-123');
      expect(result.amount).toBe(1000.00);
      expect(result.status).toBe('pending');
    });

    test('should create payment with auto-generated submission ID', async () => {
      const paymentData = {
        userId: 'user-123',
        amount: 500.00,
      };

      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-auto',
          user_id: 'user-123',
          amount: 500.00,
          submission_id: 'PAY-1234567890',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Payment.create(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-auto');
    });
  });

  describe('findById', () => {
    test('should find payment by ID', async () => {
      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          user_id: 'user-123',
          amount: 1000.00,
          status: 'completed',
        },
        error: null,
      });

      const result = await Payment.findById('payment-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-123');
    });

    test('should return null if payment not found', async () => {
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await Payment.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    test('should find payments by user ID', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [
          {
            id: 'payment-1',
            user_id: 'user-123',
            amount: 1000.00,
          },
          {
            id: 'payment-2',
            user_id: 'user-123',
            amount: 500.00,
          },
        ],
        error: null,
      });

      const result = await Payment.find({ userId: 'user-123' });

      expect(result).toHaveLength(2);
    });

    test('should filter by status', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [
          {
            id: 'payment-completed',
            status: 'completed',
          },
        ],
        error: null,
      });

      const result = await Payment.find({ status: 'completed' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
    });
  });

  describe('findBySubmissionId', () => {
    test('should find payment by submission ID', async () => {
      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          submission_id: 'submission-123',
          amount: 1000.00,
        },
        error: null,
      });

      const result = await Payment.findBySubmissionId('submission-123');

      expect(result).toBeDefined();
      expect(result.submissionId).toBe('submission-123');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update payment status', async () => {
      const updateData = {
        status: 'completed',
        paymentTransactionHash: 'txn-123456',
      };

      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          status: 'completed',
          payment_transaction_hash: 'txn-123456',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Payment.findByIdAndUpdate('payment-123', updateData);

      expect(result.status).toBe('completed');
      expect(result.paymentTransactionHash).toBe('txn-123456');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete payment successfully', async () => {
      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          amount: 1000.00,
        },
        error: null,
      });

      const result = await Payment.findByIdAndDelete('payment-123');

      expect(result.id).toBe('payment-123');
    });
  });

  describe('Status Updates', () => {
    test('should update payment to completed', async () => {
      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Payment.findByIdAndUpdate('payment-123', {
        status: 'completed',
      });

      expect(result.status).toBe('completed');
    });

    test('should update payment to failed', async () => {
      mockSupabase.setMockResponse('payments', {
        data: {
          id: 'payment-123',
          status: 'failed',
          error_message: 'Insufficient funds',
        },
        error: null,
      });

      const result = await Payment.findByIdAndUpdate('payment-123', {
        status: 'failed',
        errorMessage: 'Insufficient funds',
      });

      expect(result.status).toBe('failed');
    });
  });
});
