/**
 * Tests for Payment Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Payment = require('../../../src/models/supabase/payment');

describe('Payment Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create payment with full data successfully', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        submission_id: 'sub-456',
        payment_image: 'https://example.com/receipt.jpg',
        payment_transaction_hash: '0xabc123',
        token_transaction_hash: '0xdef456',
        amount: '50000.00',
        structure_id: 'struct-789',
        contract_id: 'contract-001',
        status: 'pending',
        token_id: 'token-123',
        tokens: 1000,
        user_id: 'user-456',
        payment_method: 'bank_transfer',
        investor_name: 'John Doe',
        structure_name: 'Tech Fund I',
        tickets_purchased: 10,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        receipt_file_name: 'receipt_2024.pdf',
        submitted_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.create({
        email: 'investor@example.com',
        submissionId: 'sub-456',
        paymentImage: 'https://example.com/receipt.jpg',
        paymentTransactionHash: '0xabc123',
        mintTransactionHash: '0xdef456',
        amount: 50000,
        structureId: 'struct-789',
        contractId: 'contract-001',
        status: 'pending',
        tokenId: 'token-123',
        tokens: 1000,
        userId: 'user-456',
        paymentMethod: 'bank_transfer',
        investorName: 'John Doe',
        structureName: 'Tech Fund I',
        ticketsPurchased: 10,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        receiptFileName: 'receipt_2024.pdf',
        submittedAt: '2024-01-15T10:00:00Z'
      });

      expect(result.id).toBe('payment-123');
      expect(result.email).toBe('investor@example.com');
      expect(result.amount).toBe(50000);
      expect(result.status).toBe('pending');
      expect(result.paymentMethod).toBe('bank_transfer');
    });

    test('should create payment with minimal data', async () => {
      const dbResponse = {
        id: 'payment-minimal',
        email: 'user@example.com',
        amount: '1000.00',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.create({
        email: 'user@example.com',
        amount: 1000,
        status: 'pending'
      });

      expect(result.id).toBe('payment-minimal');
      expect(result.email).toBe('user@example.com');
      expect(result.amount).toBe(1000);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      await expect(Payment.create({ email: 'test@example.com' })).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find payment by ID successfully', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '25000.00',
        status: 'approved',
        structure_id: 'struct-456',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-123');

      expect(result.id).toBe('payment-123');
      expect(result.email).toBe('investor@example.com');
      expect(result.amount).toBe(25000);
      expect(result.status).toBe('approved');
    });

    test('should return null if payment not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      const result = await Payment.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      await expect(Payment.findById('payment-123')).rejects.toThrow('Database error');
    });
  });

  describe('findBySubmissionId', () => {
    test('should find payment by submission ID', async () => {
      const dbResponse = {
        id: 'payment-123',
        submission_id: 'sub-456',
        email: 'investor@example.com',
        amount: '10000.00',
        status: 'pending'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findBySubmissionId('sub-456');

      expect(result.id).toBe('payment-123');
      expect(result.submissionId).toBe('sub-456');
      expect(result.amount).toBe(10000);
    });

    test('should return null if submission not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      const result = await Payment.findBySubmissionId('nonexistent-sub');
      expect(result).toBeNull();
    });
  });

  describe('findByTransactionHash', () => {
    test('should find payment by transaction hash', async () => {
      const dbResponse = {
        id: 'payment-123',
        payment_transaction_hash: '0xabc123def456',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'approved'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByTransactionHash('0xabc123def456');

      expect(result.id).toBe('payment-123');
      expect(result.paymentTransactionHash).toBe('0xabc123def456');
      expect(result.amount).toBe(5000);
    });

    test('should return null if transaction hash not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      const result = await Payment.findByTransactionHash('0xnonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('should find all payments by email', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          email: 'investor@example.com',
          amount: '1000.00',
          status: 'approved',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'payment-2',
          email: 'investor@example.com',
          amount: '2000.00',
          status: 'pending',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByEmail('Investor@Example.COM');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('payment-1');
      expect(result[1].id).toBe('payment-2');
      expect(result[0].amount).toBe(1000);
      expect(result[1].amount).toBe(2000);
    });

    test('should convert email to lowercase when searching', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null
      });

      await Payment.findByEmail('Test@EXAMPLE.COM');

      // Email should be lowercased in the query
      const result = await Payment.findByEmail('test@example.com');
      expect(result).toEqual([]);
    });

    test('should return empty array if no payments found', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null
      });

      const result = await Payment.findByEmail('nopayments@example.com');
      expect(result).toEqual([]);
    });
  });

  describe('findByStructureId', () => {
    test('should find all payments for a structure', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          structure_id: 'struct-123',
          email: 'investor1@example.com',
          amount: '10000.00',
          status: 'approved',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'payment-2',
          structure_id: 'struct-123',
          email: 'investor2@example.com',
          amount: '20000.00',
          status: 'pending',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByStructureId('struct-123');

      expect(result).toHaveLength(2);
      expect(result[0].structureId).toBe('struct-123');
      expect(result[1].structureId).toBe('struct-123');
      expect(result[0].amount).toBe(10000);
    });

    test('should return empty array if no payments for structure', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null
      });

      const result = await Payment.findByStructureId('struct-empty');
      expect(result).toEqual([]);
    });
  });

  describe('findByContractId', () => {
    test('should find all payments for a contract', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          contract_id: 'contract-456',
          email: 'investor@example.com',
          amount: '5000.00',
          status: 'approved',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByContractId('contract-456');

      expect(result).toHaveLength(1);
      expect(result[0].contractId).toBe('contract-456');
      expect(result[0].amount).toBe(5000);
    });

    test('should return empty array if no payments for contract', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null
      });

      const result = await Payment.findByContractId('contract-none');
      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    test('should find all pending payments', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          email: 'investor1@example.com',
          amount: '1000.00',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'payment-2',
          email: 'investor2@example.com',
          amount: '2000.00',
          status: 'pending',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByStatus('pending');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });

    test('should find all approved payments', async () => {
      const dbResponse = [
        {
          id: 'payment-approved',
          email: 'investor@example.com',
          amount: '5000.00',
          status: 'approved',
          processed_by: 'admin-123',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByStatus('approved');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
      expect(result[0].processedBy).toBe('admin-123');
    });

    test('should find all rejected payments', async () => {
      const dbResponse = [
        {
          id: 'payment-rejected',
          email: 'investor@example.com',
          amount: '3000.00',
          status: 'rejected',
          admin_notes: 'Insufficient documentation',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByStatus('rejected');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('rejected');
      expect(result[0].adminNotes).toBe('Insufficient documentation');
    });
  });

  describe('find', () => {
    test('should find payments with single criteria', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          structure_id: 'struct-123',
          status: 'approved',
          amount: '10000.00',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.find({ structureId: 'struct-123' });

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('struct-123');
    });

    test('should find payments with multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          structure_id: 'struct-123',
          status: 'pending',
          email: 'investor@example.com',
          amount: '5000.00',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.find({
        structureId: 'struct-123',
        status: 'pending',
        email: 'investor@example.com'
      });

      expect(result).toHaveLength(1);
      expect(result[0].structureId).toBe('struct-123');
      expect(result[0].status).toBe('pending');
      expect(result[0].email).toBe('investor@example.com');
    });

    test('should return all payments when no criteria provided', async () => {
      const dbResponse = [
        {
          id: 'payment-1',
          email: 'investor1@example.com',
          amount: '1000.00',
          status: 'approved',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'payment-2',
          email: 'investor2@example.com',
          amount: '2000.00',
          status: 'pending',
          created_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.find();

      expect(result).toHaveLength(2);
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update payment successfully', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'approved',
        payment_transaction_hash: '0xnew123',
        updated_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByIdAndUpdate('payment-123', {
        status: 'approved',
        paymentTransactionHash: '0xnew123'
      });

      expect(result.id).toBe('payment-123');
      expect(result.status).toBe('approved');
      expect(result.paymentTransactionHash).toBe('0xnew123');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      await expect(Payment.findByIdAndUpdate('payment-123', { status: 'approved' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete payment successfully', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '1000.00',
        status: 'pending'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findByIdAndDelete('payment-123');

      expect(result.id).toBe('payment-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      await expect(Payment.findByIdAndDelete('payment-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('updateStatus', () => {
    test('should update payment status', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'approved',
        updated_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.updateStatus('payment-123', 'approved');

      expect(result.id).toBe('payment-123');
      expect(result.status).toBe('approved');
    });
  });

  describe('updateTransactionHash', () => {
    test('should update payment transaction hash', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        payment_transaction_hash: '0xupdated123',
        amount: '5000.00',
        status: 'pending'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.updateTransactionHash('payment-123', '0xupdated123');

      expect(result.id).toBe('payment-123');
      expect(result.paymentTransactionHash).toBe('0xupdated123');
    });
  });

  describe('updateTokenTransactionHash', () => {
    test('should update token transaction hash', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        token_transaction_hash: '0xtoken456',
        amount: '5000.00',
        status: 'approved'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.updateTokenTransactionHash('payment-123', '0xtoken456');

      expect(result.id).toBe('payment-123');
      expect(result.mintTransactionHash).toBe('0xtoken456');
    });
  });

  describe('approve', () => {
    test('should approve payment with admin notes', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '10000.00',
        status: 'approved',
        processed_by: 'admin-456',
        processed_at: '2024-01-15T12:00:00Z',
        admin_notes: 'Payment verified and approved'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.approve('payment-123', 'admin-456', 'Payment verified and approved');

      expect(result.status).toBe('approved');
      expect(result.processedBy).toBe('admin-456');
      expect(result.processedAt).toBeDefined();
      expect(result.adminNotes).toBe('Payment verified and approved');
    });

    test('should approve payment without admin notes', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'approved',
        processed_by: 'admin-789',
        processed_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.approve('payment-123', 'admin-789');

      expect(result.status).toBe('approved');
      expect(result.processedBy).toBe('admin-789');
      expect(result.processedAt).toBeDefined();
    });
  });

  describe('reject', () => {
    test('should reject payment with reason', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '3000.00',
        status: 'rejected',
        processed_by: 'admin-456',
        processed_at: '2024-01-15T12:00:00Z',
        admin_notes: 'Insufficient documentation provided'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.reject('payment-123', 'admin-456', 'Insufficient documentation provided');

      expect(result.status).toBe('rejected');
      expect(result.processedBy).toBe('admin-456');
      expect(result.processedAt).toBeDefined();
      expect(result.adminNotes).toBe('Insufficient documentation provided');
    });
  });

  describe('getStats', () => {
    test('should calculate payment statistics correctly', async () => {
      const dbResponse = [
        { status: 'pending', amount: '1000.00' },
        { status: 'pending', amount: '2000.00' },
        { status: 'approved', amount: '5000.00' },
        { status: 'approved', amount: '3000.00' },
        { status: 'rejected', amount: '500.00' }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.getStats();

      expect(result.total).toBe(5);
      expect(result.pending).toBe(2);
      expect(result.approved).toBe(2);
      expect(result.rejected).toBe(1);
      expect(result.totalAmount).toBe(11500);
      expect(result.pendingAmount).toBe(3000);
      expect(result.approvedAmount).toBe(8000);
    });

    test('should handle empty payments list', async () => {
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null
      });

      const result = await Payment.getStats();

      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.approved).toBe(0);
      expect(result.rejected).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.pendingAmount).toBe(0);
      expect(result.approvedAmount).toBe(0);
    });

    test('should handle invalid amounts gracefully', async () => {
      const dbResponse = [
        { status: 'approved', amount: 'invalid' },
        { status: 'pending', amount: null },
        { status: 'approved', amount: '1000.00' }
      ];

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.getStats();

      expect(result.total).toBe(3);
      expect(result.totalAmount).toBe(1000);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('payments', {
        data: null,
        error: error
      });

      await expect(Payment.getStats()).rejects.toThrow('Database error');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        submission_id: 'sub-456',
        payment_image: 'https://example.com/image.jpg',
        payment_transaction_hash: '0xabc',
        token_transaction_hash: '0xdef',
        amount: '5000.00',
        structure_id: 'struct-123',
        contract_id: 'contract-456',
        status: 'approved',
        payment_method: 'bank_transfer',
        investor_name: 'John Doe',
        structure_name: 'Fund I',
        tickets_purchased: 5,
        wallet_address: '0x123',
        receipt_file_name: 'receipt.pdf',
        processed_by: 'admin-123',
        processed_at: '2024-01-15T12:00:00Z',
        admin_notes: 'All good',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-123');

      expect(result.submissionId).toBe('sub-456');
      expect(result.paymentImage).toBe('https://example.com/image.jpg');
      expect(result.paymentTransactionHash).toBe('0xabc');
      expect(result.mintTransactionHash).toBe('0xdef');
      expect(result.structureId).toBe('struct-123');
      expect(result.contractId).toBe('contract-456');
      expect(result.paymentMethod).toBe('bank_transfer');
      expect(result.investorName).toBe('John Doe');
      expect(result.structureName).toBe('Fund I');
      expect(result.ticketsPurchased).toBe(5);
      expect(result.walletAddress).toBe('0x123');
      expect(result.receiptFileName).toBe('receipt.pdf');
      expect(result.processedBy).toBe('admin-123');
      expect(result.processedAt).toBe('2024-01-15T12:00:00Z');
      expect(result.adminNotes).toBe('All good');
    });

    test('should parse amount as float', async () => {
      const dbResponse = {
        id: 'payment-123',
        email: 'investor@example.com',
        amount: '12345.67',
        status: 'approved'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-123');

      expect(result.amount).toBe(12345.67);
      expect(typeof result.amount).toBe('number');
    });

    test('should handle zero amount', async () => {
      const dbResponse = {
        id: 'payment-zero',
        email: 'investor@example.com',
        amount: '0.00',
        status: 'pending'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-zero');

      expect(result.amount).toBe(0);
    });
  });

  describe('Payment workflow scenarios', () => {
    test('should handle complete payment approval workflow', async () => {
      // Create payment
      const createResponse = {
        id: 'payment-workflow',
        email: 'investor@example.com',
        amount: '10000.00',
        status: 'pending',
        structure_id: 'struct-123',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: createResponse,
        error: null
      });

      const created = await Payment.create({
        email: 'investor@example.com',
        amount: 10000,
        status: 'pending',
        structureId: 'struct-123'
      });

      expect(created.status).toBe('pending');

      // Approve payment
      const approveResponse = {
        id: 'payment-workflow',
        email: 'investor@example.com',
        amount: '10000.00',
        status: 'approved',
        processed_by: 'admin-123',
        processed_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: approveResponse,
        error: null
      });

      const approved = await Payment.approve('payment-workflow', 'admin-123');

      expect(approved.status).toBe('approved');
      expect(approved.processedBy).toBe('admin-123');
    });

    test('should handle payment rejection workflow', async () => {
      // Create payment
      const createResponse = {
        id: 'payment-reject',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('payments', {
        data: createResponse,
        error: null
      });

      const created = await Payment.create({
        email: 'investor@example.com',
        amount: 5000,
        status: 'pending'
      });

      expect(created.status).toBe('pending');

      // Reject payment
      const rejectResponse = {
        id: 'payment-reject',
        email: 'investor@example.com',
        amount: '5000.00',
        status: 'rejected',
        processed_by: 'admin-456',
        processed_at: '2024-01-15T11:00:00Z',
        admin_notes: 'Invalid documentation'
      };

      mockSupabase.setMockResponse('payments', {
        data: rejectResponse,
        error: null
      });

      const rejected = await Payment.reject('payment-reject', 'admin-456', 'Invalid documentation');

      expect(rejected.status).toBe('rejected');
      expect(rejected.adminNotes).toBe('Invalid documentation');
    });
  });

  describe('Payment methods and types', () => {
    test('should handle bank transfer payment', async () => {
      const dbResponse = {
        id: 'payment-bank',
        email: 'investor@example.com',
        amount: '50000.00',
        payment_method: 'bank_transfer',
        receipt_file_name: 'transfer_receipt.pdf',
        status: 'pending'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-bank');

      expect(result.paymentMethod).toBe('bank_transfer');
      expect(result.receiptFileName).toBe('transfer_receipt.pdf');
    });

    test('should handle cryptocurrency payment', async () => {
      const dbResponse = {
        id: 'payment-crypto',
        email: 'investor@example.com',
        amount: '25000.00',
        payment_method: 'cryptocurrency',
        payment_transaction_hash: '0xabc123def456',
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        status: 'approved'
      };

      mockSupabase.setMockResponse('payments', {
        data: dbResponse,
        error: null
      });

      const result = await Payment.findById('payment-crypto');

      expect(result.paymentMethod).toBe('cryptocurrency');
      expect(result.paymentTransactionHash).toBe('0xabc123def456');
      expect(result.walletAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });
  });
});
