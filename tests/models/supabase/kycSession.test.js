/**
 * Tests for KycSession Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const KycSession = require('../../../src/models/supabase/kycSession');

describe('KycSession Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new KYC session successfully', async () => {
      const sessionData = {
        userId: 'user-123',
        sessionId: 'session-abc-123',
        provider: 'onfido',
        status: 'pending',
        expiresAt: '2024-02-15T10:00:00Z'
      };

      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-abc-123',
        provider: 'onfido',
        status: 'pending',
        expires_at: '2024-02-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.create(sessionData);

      expect(result.id).toBe('kyc-123');
      expect(result.userId).toBe('user-123');
      expect(result.sessionId).toBe('session-abc-123');
      expect(result.provider).toBe('onfido');
      expect(result.status).toBe('pending');
      expect(result.expiresAt).toBe('2024-02-15T10:00:00Z');
    });

    test('should create session with verification data', async () => {
      const sessionData = {
        userId: 'user-456',
        sessionId: 'session-xyz-456',
        provider: 'veriff',
        status: 'pending',
        verificationData: {
          checkId: 'check-123',
          applicantId: 'applicant-456'
        }
      };

      const dbResponse = {
        id: 'kyc-456',
        user_id: 'user-456',
        session_id: 'session-xyz-456',
        provider: 'veriff',
        status: 'pending',
        verification_data: {
          checkId: 'check-123',
          applicantId: 'applicant-456'
        },
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.create(sessionData);

      expect(result.verificationData).toEqual({
        checkId: 'check-123',
        applicantId: 'applicant-456'
      });
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.create({})).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find KYC session by ID successfully', async () => {
      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-abc-123',
        provider: 'onfido',
        status: 'completed'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.id).toBe('kyc-123');
      expect(result.userId).toBe('user-123');
      expect(result.provider).toBe('onfido');
    });

    test('should return null if session not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      const result = await KycSession.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findById('kyc-123')).rejects.toThrow('Database error');
    });
  });

  describe('findBySessionId', () => {
    test('should find KYC session by session ID successfully', async () => {
      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-abc-123',
        provider: 'onfido',
        status: 'pending'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findBySessionId('session-abc-123');

      expect(result.id).toBe('kyc-123');
      expect(result.sessionId).toBe('session-abc-123');
    });

    test('should return null if session not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      const result = await KycSession.findBySessionId('nonexistent-session');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findBySessionId('session-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    test('should find all KYC sessions for a user', async () => {
      const dbResponse = [
        {
          id: 'kyc-1',
          user_id: 'user-123',
          session_id: 'session-1',
          status: 'completed',
          created_at: '2024-01-20T10:00:00Z'
        },
        {
          id: 'kyc-2',
          user_id: 'user-123',
          session_id: 'session-2',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-123');
      expect(result[1].userId).toBe('user-123');
    });

    test('should return empty array if no sessions found', async () => {
      mockSupabase.setMockResponse('kyc_sessions', {
        data: [],
        error: null
      });

      const result = await KycSession.findByUserId('user-123');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findByUserId('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByStatus', () => {
    test('should find KYC sessions by status', async () => {
      const dbResponse = [
        {
          id: 'kyc-1',
          user_id: 'user-1',
          status: 'pending',
          created_at: '2024-01-20T10:00:00Z'
        },
        {
          id: 'kyc-2',
          user_id: 'user-2',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findByStatus('pending');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findByStatus('pending')).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    test('should find all sessions when no criteria provided', async () => {
      const dbResponse = [
        {
          id: 'kyc-1',
          status: 'pending'
        },
        {
          id: 'kyc-2',
          status: 'completed'
        }
      ];

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('kyc-1');
      expect(result[1].id).toBe('kyc-2');
    });

    test('should filter sessions by multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'kyc-1',
          user_id: 'user-123',
          provider: 'onfido',
          status: 'completed'
        }
      ];

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.find({
        userId: 'user-123',
        provider: 'onfido',
        status: 'completed'
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
      expect(result[0].provider).toBe('onfido');
      expect(result[0].status).toBe('completed');
    });

    test('should return empty array if no sessions found', async () => {
      mockSupabase.setMockResponse('kyc_sessions', {
        data: [],
        error: null
      });

      const result = await KycSession.find({ status: 'nonexistent' });
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.find()).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update KYC session successfully', async () => {
      const updateData = {
        status: 'completed',
        verificationData: { verified: true }
      };

      const dbResponse = {
        id: 'kyc-123',
        status: 'completed',
        verification_data: { verified: true },
        completed_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findByIdAndUpdate('kyc-123', updateData);

      expect(result.id).toBe('kyc-123');
      expect(result.status).toBe('completed');
      expect(result.verificationData).toEqual({ verified: true });
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findByIdAndUpdate('kyc-123', {})).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete KYC session successfully', async () => {
      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findByIdAndDelete('kyc-123');

      expect(result.id).toBe('kyc-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.findByIdAndDelete('kyc-123')).rejects.toThrow('Database error');
    });
  });

  describe('complete', () => {
    test('should complete KYC session successfully', async () => {
      const verificationData = {
        documentType: 'passport',
        documentNumber: 'P123456',
        verified: true
      };

      const dbResponse = {
        id: 'kyc-123',
        status: 'completed',
        completed_at: new Date().toISOString(),
        verification_data: verificationData
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.complete('kyc-123', verificationData);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(result.verificationData).toEqual(verificationData);
    });

    test('should complete KYC session with PDF URL', async () => {
      const verificationData = { verified: true };
      const pdfUrl = 'https://example.com/kyc-report.pdf';

      const dbResponse = {
        id: 'kyc-123',
        status: 'completed',
        completed_at: new Date().toISOString(),
        verification_data: verificationData,
        pdf_url: pdfUrl
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.complete('kyc-123', verificationData, pdfUrl);

      expect(result.status).toBe('completed');
      expect(result.pdfUrl).toBe(pdfUrl);
      expect(result.verificationData).toEqual(verificationData);
    });

    test('should complete KYC session without PDF URL', async () => {
      const verificationData = { verified: true };

      const dbResponse = {
        id: 'kyc-123',
        status: 'completed',
        completed_at: new Date().toISOString(),
        verification_data: verificationData,
        pdf_url: null
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.complete('kyc-123', verificationData);

      expect(result.status).toBe('completed');
      expect(result.pdfUrl).toBeNull();
    });
  });

  describe('fail', () => {
    test('should fail KYC session successfully', async () => {
      const dbResponse = {
        id: 'kyc-123',
        status: 'failed',
        completed_at: new Date().toISOString(),
        verification_data: {}
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.fail('kyc-123');

      expect(result.status).toBe('failed');
      expect(result.completedAt).toBeDefined();
    });

    test('should fail KYC session with reason', async () => {
      const reason = 'Document expired';

      const dbResponse = {
        id: 'kyc-123',
        status: 'failed',
        completed_at: new Date().toISOString(),
        verification_data: { failureReason: reason }
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.fail('kyc-123', reason);

      expect(result.status).toBe('failed');
      expect(result.verificationData.failureReason).toBe(reason);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('getLatestForUser', () => {
    test('should get latest KYC session for user', async () => {
      const dbResponse = {
        id: 'kyc-latest',
        user_id: 'user-123',
        session_id: 'session-latest',
        status: 'pending',
        created_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.getLatestForUser('user-123');

      expect(result.id).toBe('kyc-latest');
      expect(result.userId).toBe('user-123');
    });

    test('should return null if user has no sessions', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      const result = await KycSession.getLatestForUser('user-new');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('kyc_sessions', {
        data: null,
        error: error
      });

      await expect(KycSession.getLatestForUser('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const sessionData = {
        userId: 'user-123',
        sessionId: 'session-abc-123',
        provider: 'onfido',
        status: 'pending',
        verificationData: { checkId: 'check-123' },
        pdfUrl: 'https://example.com/report.pdf',
        expiresAt: '2024-02-15T10:00:00Z'
      };

      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-abc-123',
        provider: 'onfido',
        status: 'pending',
        verification_data: { checkId: 'check-123' },
        pdf_url: 'https://example.com/report.pdf',
        expires_at: '2024-02-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.create(sessionData);

      expect(result.userId).toBe('user-123');
      expect(result.sessionId).toBe('session-abc-123');
      expect(result.verificationData).toEqual({ checkId: 'check-123' });
      expect(result.pdfUrl).toBe('https://example.com/report.pdf');
      expect(result.expiresAt).toBe('2024-02-15T10:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-456',
        session_id: 'session-xyz-456',
        provider: 'veriff',
        status: 'completed',
        verification_data: { verified: true, score: 95 },
        pdf_url: 'https://example.com/verification.pdf',
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-20T10:00:00Z',
        expires_at: '2024-02-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.userId).toBe('user-456');
      expect(result.sessionId).toBe('session-xyz-456');
      expect(result.provider).toBe('veriff');
      expect(result.status).toBe('completed');
      expect(result.verificationData).toEqual({ verified: true, score: 95 });
      expect(result.pdfUrl).toBe('https://example.com/verification.pdf');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.completedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.expiresAt).toBe('2024-02-15T10:00:00Z');
    });

    test('should handle null values in transformation', async () => {
      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-123',
        status: 'pending',
        verification_data: null,
        pdf_url: null,
        completed_at: null,
        expires_at: null
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.verificationData).toBeNull();
      expect(result.pdfUrl).toBeNull();
      expect(result.completedAt).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    test('should handle partial data transformation', async () => {
      const sessionData = {
        userId: 'user-123',
        sessionId: 'session-123',
        provider: 'onfido',
        status: 'pending'
      };

      const dbResponse = {
        id: 'kyc-123',
        user_id: 'user-123',
        session_id: 'session-123',
        provider: 'onfido',
        status: 'pending'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.create(sessionData);

      expect(result.userId).toBe('user-123');
      expect(result.sessionId).toBe('session-123');
      expect(result.provider).toBe('onfido');
      expect(result.status).toBe('pending');
    });
  });

  describe('KYC providers', () => {
    test('should handle onfido provider', async () => {
      const dbResponse = {
        id: 'kyc-123',
        provider: 'onfido',
        session_id: 'onfido-session-123'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.provider).toBe('onfido');
    });

    test('should handle veriff provider', async () => {
      const dbResponse = {
        id: 'kyc-123',
        provider: 'veriff',
        session_id: 'veriff-session-123'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.provider).toBe('veriff');
    });

    test('should handle jumio provider', async () => {
      const dbResponse = {
        id: 'kyc-123',
        provider: 'jumio',
        session_id: 'jumio-session-123'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.provider).toBe('jumio');
    });
  });

  describe('Session statuses', () => {
    test('should handle pending status', async () => {
      const dbResponse = {
        id: 'kyc-123',
        status: 'pending',
        completed_at: null
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.status).toBe('pending');
      expect(result.completedAt).toBeNull();
    });

    test('should handle completed status', async () => {
      const dbResponse = {
        id: 'kyc-123',
        status: 'completed',
        completed_at: '2024-01-20T10:00:00Z',
        verification_data: { verified: true }
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.verificationData.verified).toBe(true);
    });

    test('should handle failed status', async () => {
      const dbResponse = {
        id: 'kyc-123',
        status: 'failed',
        completed_at: '2024-01-20T10:00:00Z',
        verification_data: { failureReason: 'Document expired' }
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.status).toBe('failed');
      expect(result.completedAt).toBe('2024-01-20T10:00:00Z');
      expect(result.verificationData.failureReason).toBe('Document expired');
    });

    test('should handle expired status', async () => {
      const dbResponse = {
        id: 'kyc-123',
        status: 'expired',
        expires_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('kyc_sessions', {
        data: dbResponse,
        error: null
      });

      const result = await KycSession.findById('kyc-123');

      expect(result.status).toBe('expired');
      expect(result.expiresAt).toBe('2024-01-15T10:00:00Z');
    });
  });
});
