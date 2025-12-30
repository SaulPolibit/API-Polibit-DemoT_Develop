/**
 * Tests for InvestmentSubscription Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const InvestmentSubscription = require('../../../src/models/supabase/investmentSubscription');

describe('InvestmentSubscription Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new investment subscription successfully', async () => {
      const subscriptionData = {
        investmentId: 'investment-123',
        userId: 'user-456',
        fundId: 'fund-789',
        requestedAmount: 100000,
        currency: 'USD',
        status: 'draft'
      };

      const dbResponse = {
        id: 'subscription-123',
        investment_id: 'investment-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: 100000,
        currency: 'USD',
        status: 'draft',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.create(subscriptionData);

      expect(result.id).toBe('subscription-123');
      expect(result.investmentId).toBe('investment-123');
      expect(result.userId).toBe('user-456');
      expect(result.investorId).toBe('user-456'); // Backward compatibility
      expect(result.fundId).toBe('fund-789');
      expect(result.requestedAmount).toBe(100000);
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('draft');
    });

    test('should create subscription with minimal fields', async () => {
      const subscriptionData = {
        investmentId: 'investment-123',
        userId: 'user-456',
        requestedAmount: 50000
      };

      const dbResponse = {
        id: 'subscription-456',
        investment_id: 'investment-123',
        user_id: 'user-456',
        requested_amount: 50000,
        status: 'draft',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.create(subscriptionData);

      expect(result.id).toBe('subscription-456');
      expect(result.requestedAmount).toBe(50000);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.create({})).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find investment subscription by ID successfully', async () => {
      const dbResponse = {
        id: 'subscription-123',
        investment_id: 'investment-123',
        user_id: 'user-456',
        requested_amount: 100000,
        status: 'submitted'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.id).toBe('subscription-123');
      expect(result.investmentId).toBe('investment-123');
      expect(result.userId).toBe('user-456');
      expect(result.requestedAmount).toBe(100000);
    });

    test('should return null if subscription not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      const result = await InvestmentSubscription.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findById('subscription-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByInvestmentId', () => {
    test('should find subscriptions by investment ID', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          investment_id: 'investment-123',
          user_id: 'user-1',
          requested_amount: 100000,
          status: 'submitted'
        },
        {
          id: 'subscription-2',
          investment_id: 'investment-123',
          user_id: 'user-2',
          requested_amount: 75000,
          status: 'approved'
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByInvestmentId('investment-123');

      expect(result).toHaveLength(2);
      expect(result[0].investmentId).toBe('investment-123');
      expect(result[1].investmentId).toBe('investment-123');
      expect(result[0].userId).toBe('user-1');
      expect(result[1].userId).toBe('user-2');
    });

    test('should return empty array if no subscriptions found', async () => {
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: [],
        error: null
      });

      const result = await InvestmentSubscription.findByInvestmentId('investment-123');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByInvestmentId('investment-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByInvestorId', () => {
    test('should find subscriptions by investor ID', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          investment_id: 'investment-1',
          user_id: 'user-123',
          requested_amount: 100000,
          status: 'submitted'
        },
        {
          id: 'subscription-2',
          investment_id: 'investment-2',
          user_id: 'user-123',
          requested_amount: 50000,
          status: 'approved'
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByInvestorId('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-123');
      expect(result[1].userId).toBe('user-123');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByInvestorId('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    test('should find subscriptions by user ID (alias)', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          user_id: 'user-123',
          requested_amount: 100000
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByUserId('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
    });
  });

  describe('findByFundId', () => {
    test('should find subscriptions by fund ID', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          fund_id: 'fund-789',
          user_id: 'user-1',
          requested_amount: 100000
        },
        {
          id: 'subscription-2',
          fund_id: 'fund-789',
          user_id: 'user-2',
          requested_amount: 75000
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByFundId('fund-789');

      expect(result).toHaveLength(2);
      expect(result[0].fundId).toBe('fund-789');
      expect(result[1].fundId).toBe('fund-789');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByFundId('fund-789')).rejects.toThrow('Database error');
    });
  });

  describe('findByStatus', () => {
    test('should find subscriptions by status', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          status: 'submitted',
          requested_amount: 100000
        },
        {
          id: 'subscription-2',
          status: 'submitted',
          requested_amount: 75000
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByStatus('submitted');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('submitted');
      expect(result[1].status).toBe('submitted');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByStatus('submitted')).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    test('should find all subscriptions when no criteria provided', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          status: 'submitted'
        },
        {
          id: 'subscription-2',
          status: 'approved'
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('subscription-1');
      expect(result[1].id).toBe('subscription-2');
    });

    test('should filter subscriptions by multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'subscription-1',
          investment_id: 'investment-123',
          user_id: 'user-456',
          status: 'submitted'
        }
      ];

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.find({
        investmentId: 'investment-123',
        userId: 'user-456',
        status: 'submitted'
      });

      expect(result).toHaveLength(1);
      expect(result[0].investmentId).toBe('investment-123');
      expect(result[0].userId).toBe('user-456');
      expect(result[0].status).toBe('submitted');
    });

    test('should return empty array if no subscriptions found', async () => {
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: [],
        error: null
      });

      const result = await InvestmentSubscription.find({ status: 'nonexistent' });
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.find()).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update subscription successfully', async () => {
      const updateData = {
        status: 'approved',
        adminNotes: 'Approved for investment'
      };

      const dbResponse = {
        id: 'subscription-123',
        status: 'approved',
        admin_notes: 'Approved for investment',
        approved_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByIdAndUpdate('subscription-123', updateData);

      expect(result.id).toBe('subscription-123');
      expect(result.status).toBe('approved');
      expect(result.adminNotes).toBe('Approved for investment');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByIdAndUpdate('subscription-123', {})).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete subscription successfully', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'draft'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findByIdAndDelete('subscription-123');

      expect(result.id).toBe('subscription-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investment_subscriptions', {
        data: null,
        error: error
      });

      await expect(InvestmentSubscription.findByIdAndDelete('subscription-123')).rejects.toThrow('Database error');
    });
  });

  describe('approve', () => {
    test('should approve subscription successfully', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_reason: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.approve('subscription-123');

      expect(result.status).toBe('approved');
      expect(result.approvedAt).toBeDefined();
    });

    test('should approve subscription with reason', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_reason: 'Meets all requirements'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.approve('subscription-123', 'Meets all requirements');

      expect(result.status).toBe('approved');
      expect(result.approvalReason).toBe('Meets all requirements');
      expect(result.approvedAt).toBeDefined();
    });
  });

  describe('reject', () => {
    test('should reject subscription successfully', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        approval_reason: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.reject('subscription-123');

      expect(result.status).toBe('rejected');
      expect(result.rejectedAt).toBeDefined();
    });

    test('should reject subscription with reason', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        approval_reason: 'Insufficient funds'
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.reject('subscription-123', 'Insufficient funds');

      expect(result.status).toBe('rejected');
      expect(result.approvalReason).toBe('Insufficient funds');
      expect(result.rejectedAt).toBeDefined();
    });
  });

  describe('submit', () => {
    test('should submit subscription successfully', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.submit('subscription-123');

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBeDefined();
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const subscriptionData = {
        investmentId: 'investment-123',
        userId: 'user-456',
        fundId: 'fund-789',
        requestedAmount: 100000,
        currency: 'USD',
        status: 'submitted',
        approvalReason: 'Approved',
        adminNotes: 'Good investment',
        linkedFundOwnershipCreated: true
      };

      const dbResponse = {
        id: 'subscription-123',
        investment_id: 'investment-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: 100000,
        currency: 'USD',
        status: 'submitted',
        approval_reason: 'Approved',
        admin_notes: 'Good investment',
        linked_fund_ownership_created: true
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.create(subscriptionData);

      expect(result.investmentId).toBe('investment-123');
      expect(result.userId).toBe('user-456');
      expect(result.fundId).toBe('fund-789');
      expect(result.requestedAmount).toBe(100000);
      expect(result.approvalReason).toBe('Approved');
      expect(result.adminNotes).toBe('Good investment');
      expect(result.linkedFundOwnershipCreated).toBe(true);
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'subscription-123',
        investment_id: 'investment-123',
        user_id: 'user-456',
        fund_id: 'fund-789',
        requested_amount: 100000,
        currency: 'USD',
        status: 'approved',
        approval_reason: 'Good investor',
        created_at: '2024-01-15T10:00:00Z',
        submitted_at: '2024-01-16T10:00:00Z',
        approved_at: '2024-01-20T10:00:00Z',
        admin_notes: 'Approved by admin',
        linked_fund_ownership_created: true
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.investmentId).toBe('investment-123');
      expect(result.userId).toBe('user-456');
      expect(result.investorId).toBe('user-456'); // Backward compatibility
      expect(result.fundId).toBe('fund-789');
      expect(result.requestedAmount).toBe(100000);
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('approved');
      expect(result.approvalReason).toBe('Good investor');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.submittedAt).toBe('2024-01-16T10:00:00Z');
      expect(result.approvedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.adminNotes).toBe('Approved by admin');
      expect(result.linkedFundOwnershipCreated).toBe(true);
    });

    test('should handle null values in transformation', async () => {
      const dbResponse = {
        id: 'subscription-123',
        investment_id: 'investment-123',
        user_id: 'user-456',
        requested_amount: 100000,
        fund_id: null,
        approval_reason: null,
        admin_notes: null,
        submitted_at: null,
        approved_at: null,
        rejected_at: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.fundId).toBeNull();
      expect(result.approvalReason).toBeNull();
      expect(result.adminNotes).toBeNull();
      expect(result.submittedAt).toBeNull();
      expect(result.approvedAt).toBeNull();
      expect(result.rejectedAt).toBeNull();
    });

    test('should handle partial data transformation', async () => {
      const subscriptionData = {
        investmentId: 'investment-123',
        userId: 'user-456',
        requestedAmount: 50000
      };

      const dbResponse = {
        id: 'subscription-456',
        investment_id: 'investment-123',
        user_id: 'user-456',
        requested_amount: 50000
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.create(subscriptionData);

      expect(result.investmentId).toBe('investment-123');
      expect(result.userId).toBe('user-456');
      expect(result.requestedAmount).toBe(50000);
    });
  });

  describe('Subscription statuses', () => {
    test('should handle draft status', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'draft',
        submitted_at: null,
        approved_at: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.status).toBe('draft');
      expect(result.submittedAt).toBeNull();
      expect(result.approvedAt).toBeNull();
    });

    test('should handle submitted status', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'submitted',
        submitted_at: '2024-01-16T10:00:00Z',
        approved_at: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBe('2024-01-16T10:00:00Z');
      expect(result.approvedAt).toBeNull();
    });

    test('should handle approved status', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'approved',
        submitted_at: '2024-01-16T10:00:00Z',
        approved_at: '2024-01-20T10:00:00Z',
        rejected_at: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.status).toBe('approved');
      expect(result.submittedAt).toBe('2024-01-16T10:00:00Z');
      expect(result.approvedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.rejectedAt).toBeNull();
    });

    test('should handle rejected status', async () => {
      const dbResponse = {
        id: 'subscription-123',
        status: 'rejected',
        submitted_at: '2024-01-16T10:00:00Z',
        rejected_at: '2024-01-20T10:00:00Z',
        approval_reason: 'Does not meet requirements',
        approved_at: null
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.status).toBe('rejected');
      expect(result.submittedAt).toBe('2024-01-16T10:00:00Z');
      expect(result.rejectedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.approvalReason).toBe('Does not meet requirements');
      expect(result.approvedAt).toBeNull();
    });
  });

  describe('Backward compatibility', () => {
    test('should map both userId and investorId from user_id', async () => {
      const dbResponse = {
        id: 'subscription-123',
        user_id: 'user-456',
        investment_id: 'investment-123',
        requested_amount: 100000
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.findById('subscription-123');

      expect(result.userId).toBe('user-456');
      expect(result.investorId).toBe('user-456');
      expect(result.userId).toBe(result.investorId);
    });

    test('should accept both userId and investorId when creating', async () => {
      const subscriptionData = {
        investmentId: 'investment-123',
        investorId: 'user-789', // Using investorId
        requestedAmount: 50000
      };

      const dbResponse = {
        id: 'subscription-789',
        investment_id: 'investment-123',
        user_id: 'user-789',
        requested_amount: 50000
      };

      mockSupabase.setMockResponse('investment_subscriptions', {
        data: dbResponse,
        error: null
      });

      const result = await InvestmentSubscription.create(subscriptionData);

      expect(result.userId).toBe('user-789');
      expect(result.investorId).toBe('user-789');
    });
  });
});
