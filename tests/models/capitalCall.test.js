/**
 * CapitalCall Model Tests
 * Tests for src/models/supabase/capitalCall.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const CapitalCall = require('../../src/models/supabase/capitalCall');

describe('CapitalCall Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new capital call successfully', async () => {
      const capitalCallData = {
        structureId: 'structure-123',
        callNumber: 1,
        callDate: '2024-01-15',
        dueDate: '2024-02-15',
        totalCallAmount: 500000,
        totalPaidAmount: 0,
        totalUnpaidAmount: 500000,
        status: 'Draft',
        purpose: 'Investment in Project A',
        notes: 'First capital call for 2024',
        createdBy: 'user-admin',
      };

      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Draft',
          purpose: 'Investment in Project A',
          notes: 'First capital call for 2024',
          investment_id: null,
          sent_date: null,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.create(capitalCallData);

      expect(capitalCall).toBeDefined();
      expect(capitalCall.id).toBe('capital-call-123');
      expect(capitalCall.structureId).toBe('structure-123');
      expect(capitalCall.callNumber).toBe(1);
      expect(capitalCall.totalCallAmount).toBe(500000);
      expect(capitalCall.status).toBe('Draft');
      expect(capitalCall.purpose).toBe('Investment in Project A');
    });

    test('should create capital call with minimal fields', async () => {
      const capitalCallData = {
        structureId: 'structure-456',
        totalCallAmount: 100000,
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-456',
          structure_id: 'structure-456',
          call_number: null,
          call_date: null,
          due_date: null,
          total_call_amount: 100000,
          total_paid_amount: null,
          total_unpaid_amount: null,
          status: null,
          purpose: null,
          notes: null,
          investment_id: null,
          sent_date: null,
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.create(capitalCallData);

      expect(capitalCall).toBeDefined();
      expect(capitalCall.structureId).toBe('structure-456');
      expect(capitalCall.totalCallAmount).toBe(100000);
    });

    test('should throw error if creation fails', async () => {
      const capitalCallData = {
        structureId: 'structure-123',
        totalCallAmount: 100000,
      };

      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Database constraint violation' },
      });

      await expect(CapitalCall.create(capitalCallData)).rejects.toThrow(
        'Error creating capital call: Database constraint violation'
      );
    });
  });

  describe('findById', () => {
    test('should find capital call by ID successfully', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 2,
          call_date: '2024-02-01',
          due_date: '2024-03-01',
          total_call_amount: 250000,
          total_paid_amount: 100000,
          total_unpaid_amount: 150000,
          status: 'Sent',
          purpose: 'Quarterly investment',
          notes: 'Q1 2024 capital call',
          investment_id: 'investment-123',
          sent_date: '2024-02-01T10:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.findById('capital-call-123');

      expect(capitalCall).toBeDefined();
      expect(capitalCall.id).toBe('capital-call-123');
      expect(capitalCall.callNumber).toBe(2);
      expect(capitalCall.status).toBe('Sent');
      expect(capitalCall.totalPaidAmount).toBe(100000);
      expect(capitalCall.totalUnpaidAmount).toBe(150000);
    });

    test('should return null if capital call not found', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const capitalCall = await CapitalCall.findById('nonexistent-id');

      expect(capitalCall).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Connection error', code: 'DB_ERROR' },
      });

      await expect(CapitalCall.findById('capital-call-123')).rejects.toThrow(
        'Error finding capital call: Connection error'
      );
    });
  });

  describe('find', () => {
    test('should find all capital calls when no filter provided', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-1',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 500000,
            total_unpaid_amount: 0,
            status: 'Paid',
            purpose: 'Investment A',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-15T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          {
            id: 'capital-call-2',
            structure_id: 'structure-456',
            call_number: 1,
            call_date: '2024-01-10',
            due_date: '2024-02-10',
            total_call_amount: 300000,
            total_paid_amount: 0,
            total_unpaid_amount: 300000,
            status: 'Sent',
            purpose: 'Investment B',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-10T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.find();

      expect(capitalCalls).toHaveLength(2);
      expect(capitalCalls[0].id).toBe('capital-call-1');
      expect(capitalCalls[1].id).toBe('capital-call-2');
    });

    test('should find capital calls by status filter', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-draft',
            structure_id: 'structure-123',
            call_number: 3,
            call_date: '2024-03-01',
            due_date: '2024-04-01',
            total_call_amount: 200000,
            total_paid_amount: 0,
            total_unpaid_amount: 200000,
            status: 'Draft',
            purpose: 'New investment',
            notes: null,
            investment_id: null,
            sent_date: null,
            created_by: 'user-admin',
            created_at: '2024-03-01T00:00:00Z',
            updated_at: '2024-03-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.find({ status: 'Draft' });

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].status).toBe('Draft');
    });

    test('should return empty array if no capital calls found', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [],
        error: null,
      });

      const capitalCalls = await CapitalCall.find({ structureId: 'nonexistent' });

      expect(capitalCalls).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(CapitalCall.find()).rejects.toThrow(
        'Error finding capital calls: Query error'
      );
    });
  });

  describe('findByStructureId', () => {
    test('should find capital calls by structure ID', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-1',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 0,
            total_unpaid_amount: 500000,
            status: 'Sent',
            purpose: 'Investment',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-15T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.findByStructureId('structure-123');

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].structureId).toBe('structure-123');
    });
  });

  describe('findByUserId', () => {
    test('should find capital calls created by user', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-1',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 0,
            total_unpaid_amount: 500000,
            status: 'Draft',
            purpose: 'Investment',
            notes: null,
            investment_id: null,
            sent_date: null,
            created_by: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.findByUserId('user-123');

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].createdBy).toBe('user-123');
    });
  });

  describe('findByStatus', () => {
    test('should find capital calls by status', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-sent',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 200000,
            total_unpaid_amount: 300000,
            status: 'Sent',
            purpose: 'Investment',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-15T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.findByStatus('Sent');

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].status).toBe('Sent');
    });

    test('should find capital calls by status and structure ID', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-paid',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 500000,
            total_unpaid_amount: 0,
            status: 'Paid',
            purpose: 'Investment',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-15T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-02-15T00:00:00Z',
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.findByStatus('Paid', 'structure-123');

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].status).toBe('Paid');
      expect(capitalCalls[0].structureId).toBe('structure-123');
    });
  });

  describe('findByInvestorId', () => {
    test('should find capital calls for an investor', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: [
          {
            id: 'capital-call-1',
            structure_id: 'structure-123',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            total_call_amount: 500000,
            total_paid_amount: 0,
            total_unpaid_amount: 500000,
            status: 'Sent',
            purpose: 'Investment',
            notes: null,
            investment_id: null,
            sent_date: '2024-01-15T00:00:00Z',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            capital_call_allocations: [{ user_id: 'investor-123' }],
          },
        ],
        error: null,
      });

      const capitalCalls = await CapitalCall.findByInvestorId('investor-123');

      expect(capitalCalls).toHaveLength(1);
      expect(capitalCalls[0].id).toBe('capital-call-1');
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(CapitalCall.findByInvestorId('investor-123')).rejects.toThrow(
        'Error finding capital calls by user: Query error'
      );
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update capital call successfully', async () => {
      const updateData = {
        status: 'Sent',
        sentDate: '2024-01-15T10:00:00Z',
      };

      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Sent',
          purpose: 'Investment',
          notes: 'Updated notes',
          investment_id: null,
          sent_date: '2024-01-15T10:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });

      const updated = await CapitalCall.findByIdAndUpdate('capital-call-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.status).toBe('Sent');
      expect(updated.sentDate).toBe('2024-01-15T10:00:00Z');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        CapitalCall.findByIdAndUpdate('capital-call-123', { status: 'Sent' })
      ).rejects.toThrow('Error updating capital call: Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete capital call successfully', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Draft',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: null,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await CapitalCall.findByIdAndDelete('capital-call-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('capital-call-123');
    });

    test('should throw error if deletion fails', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(CapitalCall.findByIdAndDelete('capital-call-123')).rejects.toThrow(
        'Error deleting capital call: Deletion failed'
      );
    });
  });

  describe('findWithAllocations', () => {
    test('should find capital call with allocations', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Sent',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          capital_call_allocations: [
            {
              id: 'allocation-1',
              capital_call_id: 'capital-call-123',
              user_id: 'investor-1',
              allocated_amount: 250000,
              paid_amount: 0,
              remaining_amount: 250000,
              status: 'Pending',
              user: {
                id: 'investor-1',
                email: 'investor1@example.com',
                first_name: 'John',
                last_name: 'Doe',
              },
            },
          ],
        },
        error: null,
      });

      const capitalCall = await CapitalCall.findWithAllocations('capital-call-123');

      expect(capitalCall).toBeDefined();
      expect(capitalCall.id).toBe('capital-call-123');
    });

    test('should throw error if not found', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { message: 'Not found' },
      });

      await expect(CapitalCall.findWithAllocations('nonexistent')).rejects.toThrow(
        'Error finding capital call with allocations: Not found'
      );
    });
  });

  describe('markAsSent', () => {
    test('should mark capital call as sent', async () => {
      // Mock the findByIdAndUpdate response
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Sent',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: new Date().toISOString(),
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const updated = await CapitalCall.markAsSent('capital-call-123');

      expect(updated).toBeDefined();
      expect(updated.status).toBe('Sent');
      expect(updated.sentDate).toBeDefined();
    });
  });

  describe('markAsPaid', () => {
    test('should mark capital call as paid', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 500000,
          total_unpaid_amount: 0,
          status: 'Paid',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-15T00:00:00Z',
        },
        error: null,
      });

      const updated = await CapitalCall.markAsPaid('capital-call-123');

      expect(updated).toBeDefined();
      expect(updated.status).toBe('Paid');
    });
  });

  describe('updatePaymentAmounts', () => {
    test('should update payment amounts for partial payment', async () => {
      // Mock findById response
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 200000,
          total_unpaid_amount: 300000,
          status: 'Partially Paid',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z',
        },
        error: null,
      });

      const updated = await CapitalCall.updatePaymentAmounts('capital-call-123', 100000);

      expect(updated).toBeDefined();
      expect(updated.totalPaidAmount).toBe(200000);
      expect(updated.totalUnpaidAmount).toBe(300000);
    });

    test('should mark as paid when fully paid', async () => {
      // Mock findById response
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 500000,
          total_unpaid_amount: 0,
          status: 'Paid',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-15T00:00:00Z',
        },
        error: null,
      });

      const updated = await CapitalCall.updatePaymentAmounts('capital-call-123', 500000);

      expect(updated.status).toBe('Paid');
      expect(updated.totalPaidAmount).toBe(500000);
      expect(updated.totalUnpaidAmount).toBe(0);
    });

    test('should throw error if capital call not found', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        CapitalCall.updatePaymentAmounts('nonexistent', 100000)
      ).rejects.toThrow('Capital call not found');
    });
  });

  describe('getSummary', () => {
    test('should get capital call summary for structure', async () => {
      mockSupabase.setMockRpcResponse('get_capital_call_summary', {
        data: {
          total_calls: 5,
          total_amount: 2500000,
          total_paid: 1500000,
          total_unpaid: 1000000,
        },
        error: null,
      });

      const summary = await CapitalCall.getSummary('structure-123');

      expect(summary).toBeDefined();
      expect(summary.total_calls).toBe(5);
      expect(summary.total_amount).toBe(2500000);
    });

    test('should throw error if RPC fails', async () => {
      mockSupabase.setMockRpcResponse('get_capital_call_summary', {
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(CapitalCall.getSummary('structure-123')).rejects.toThrow(
        'Error getting capital call summary: RPC error'
      );
    });
  });

  describe('createAllocationsForStructure', () => {
    test('should create allocations for all investors', async () => {
      // Mock investments query
      mockSupabase.setMockResponse('investments', {
        data: [
          {
            user_id: 'investor-1',
            ownership_percentage: 40,
            equity_ownership_percent: null,
          },
          {
            user_id: 'investor-2',
            ownership_percentage: 60,
            equity_ownership_percent: null,
          },
        ],
        error: null,
      });

      // Mock capital call lookup
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-123',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Draft',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: null,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Mock allocations insert
      mockSupabase.setMockResponse('capital_call_allocations', {
        data: [
          {
            id: 'allocation-1',
            capital_call_id: 'capital-call-123',
            user_id: 'investor-1',
            allocated_amount: 200000,
            paid_amount: 0,
            remaining_amount: 200000,
            status: 'Pending',
            due_date: '2024-02-15',
          },
          {
            id: 'allocation-2',
            capital_call_id: 'capital-call-123',
            user_id: 'investor-2',
            allocated_amount: 300000,
            paid_amount: 0,
            remaining_amount: 300000,
            status: 'Pending',
            due_date: '2024-02-15',
          },
        ],
        error: null,
      });

      const allocations = await CapitalCall.createAllocationsForStructure(
        'capital-call-123',
        'structure-123'
      );

      expect(allocations).toHaveLength(2);
      expect(allocations[0].allocated_amount).toBe(200000);
      expect(allocations[1].allocated_amount).toBe(300000);
    });

    test('should throw error if capital call not found', async () => {
      // Mock investments query
      mockSupabase.setMockResponse('investments', {
        data: [],
        error: null,
      });

      // Mock capital call not found
      mockSupabase.setMockResponse('capital_calls', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        CapitalCall.createAllocationsForStructure('nonexistent', 'structure-123')
      ).rejects.toThrow('Capital call not found');
    });

    test('should throw error if fetching investments fails', async () => {
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(
        CapitalCall.createAllocationsForStructure('capital-call-123', 'structure-123')
      ).rejects.toThrow('Error fetching structure investors: Query error');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'capital-call-123',
        structureId: 'structure-123',
        callNumber: 1,
        callDate: '2024-01-15',
        dueDate: '2024-02-15',
        totalCallAmount: 500000,
        totalPaidAmount: 0,
        totalUnpaidAmount: 500000,
        status: 'Draft',
        purpose: 'Investment',
        notes: 'Notes here',
        investmentId: 'investment-123',
        sentDate: '2024-01-15T00:00:00Z',
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = CapitalCall._toDbFields(modelData);

      expect(dbData.id).toBe('capital-call-123');
      expect(dbData.structure_id).toBe('structure-123');
      expect(dbData.call_number).toBe(1);
      expect(dbData.call_date).toBe('2024-01-15');
      expect(dbData.due_date).toBe('2024-02-15');
      expect(dbData.total_call_amount).toBe(500000);
      expect(dbData.total_paid_amount).toBe(0);
      expect(dbData.total_unpaid_amount).toBe(500000);
      expect(dbData.status).toBe('Draft');
      expect(dbData.purpose).toBe('Investment');
      expect(dbData.notes).toBe('Notes here');
      expect(dbData.investment_id).toBe('investment-123');
      expect(dbData.sent_date).toBe('2024-01-15T00:00:00Z');
      expect(dbData.created_by).toBe('user-admin');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'capital-call-123',
        structure_id: 'structure-123',
        call_number: 1,
        call_date: '2024-01-15',
        due_date: '2024-02-15',
        total_call_amount: 500000,
        total_paid_amount: 0,
        total_unpaid_amount: 500000,
        status: 'Draft',
        purpose: 'Investment',
        notes: 'Notes',
        investment_id: 'investment-123',
        sent_date: '2024-01-15T00:00:00Z',
        created_by: 'user-admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const modelData = CapitalCall._toModel(dbData);

      expect(modelData.id).toBe('capital-call-123');
      expect(modelData.structureId).toBe('structure-123');
      expect(modelData.callNumber).toBe(1);
      expect(modelData.callDate).toBe('2024-01-15');
      expect(modelData.dueDate).toBe('2024-02-15');
      expect(modelData.totalCallAmount).toBe(500000);
      expect(modelData.totalPaidAmount).toBe(0);
      expect(modelData.totalUnpaidAmount).toBe(500000);
      expect(modelData.status).toBe('Draft');
      expect(modelData.purpose).toBe('Investment');
      expect(modelData.notes).toBe('Notes');
      expect(modelData.investmentId).toBe('investment-123');
      expect(modelData.sentDate).toBe('2024-01-15T00:00:00Z');
      expect(modelData.createdBy).toBe('user-admin');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = CapitalCall._toModel(null);
      expect(modelData).toBeNull();
    });
  });

  describe('Capital call statuses', () => {
    test('should handle Draft status', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-draft',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Draft',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: null,
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.findById('capital-call-draft');

      expect(capitalCall.status).toBe('Draft');
      expect(capitalCall.sentDate).toBeNull();
    });

    test('should handle Sent status', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-sent',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 0,
          total_unpaid_amount: 500000,
          status: 'Sent',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.findById('capital-call-sent');

      expect(capitalCall.status).toBe('Sent');
      expect(capitalCall.sentDate).toBeDefined();
    });

    test('should handle Paid status', async () => {
      mockSupabase.setMockResponse('capital_calls', {
        data: {
          id: 'capital-call-paid',
          structure_id: 'structure-123',
          call_number: 1,
          call_date: '2024-01-15',
          due_date: '2024-02-15',
          total_call_amount: 500000,
          total_paid_amount: 500000,
          total_unpaid_amount: 0,
          status: 'Paid',
          purpose: 'Investment',
          notes: null,
          investment_id: null,
          sent_date: '2024-01-15T00:00:00Z',
          created_by: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-15T00:00:00Z',
        },
        error: null,
      });

      const capitalCall = await CapitalCall.findById('capital-call-paid');

      expect(capitalCall.status).toBe('Paid');
      expect(capitalCall.totalPaidAmount).toBe(500000);
      expect(capitalCall.totalUnpaidAmount).toBe(0);
    });
  });
});
