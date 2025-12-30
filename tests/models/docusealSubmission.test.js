/**
 * DocusealSubmission Model Tests
 * Tests for src/models/supabase/docusealSubmission.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const DocusealSubmission = require('../../src/models/supabase/docusealSubmission');

describe('DocusealSubmission Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new DocuSeal submission successfully', async () => {
      const submissionData = {
        email: 'investor@example.com',
        submissionId: 12345,
        submissionURL: 'https://docuseal.co/s/abc123',
        auditLogUrl: 'https://docuseal.co/audit/abc123',
        status: 'pending',
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-123',
          email: 'investor@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/abc123',
          status: 'pending',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.create(submissionData);

      expect(submission).toBeDefined();
      expect(submission.id).toBe('submission-123');
      expect(submission.email).toBe('investor@example.com');
      expect(submission.submissionId).toBe(12345);
      expect(submission.submissionURL).toBe('https://docuseal.co/s/abc123');
      expect(submission.auditLogUrl).toBe('https://docuseal.co/audit/abc123');
      expect(submission.status).toBe('pending');
      expect(submission.userId).toBe('user-123');
      expect(submission.createdAt).toBeDefined();
      expect(submission.updatedAt).toBeDefined();
    });

    test('should create submission with minimal fields', async () => {
      const submissionData = {
        email: 'test@example.com',
        submissionId: 99999,
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-456',
          email: 'test@example.com',
          submission_id: 99999,
          submission_url: null,
          audit_log_url: null,
          status: null,
          user_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.create(submissionData);

      expect(submission).toBeDefined();
      expect(submission.id).toBe('submission-456');
      expect(submission.email).toBe('test@example.com');
      expect(submission.submissionId).toBe(99999);
    });

    test('should throw error if creation fails', async () => {
      const submissionData = {
        email: 'test@example.com',
        submissionId: 12345,
      };

      const error = new Error('Database constraint violation');
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.create(submissionData)).rejects.toThrow('Database constraint violation');
    });
  });

  describe('findById', () => {
    test('should find submission by ID successfully', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-123',
          email: 'investor@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/abc123',
          status: 'completed',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.findById('submission-123');

      expect(submission).toBeDefined();
      expect(submission.id).toBe('submission-123');
      expect(submission.email).toBe('investor@example.com');
      expect(submission.submissionId).toBe(12345);
      expect(submission.status).toBe('completed');
    });

    test('should return null if submission not found', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const submission = await DocusealSubmission.findById('nonexistent-id');

      expect(submission).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Connection error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.findById('submission-123')).rejects.toThrow('Connection error');
    });
  });

  describe('findBySubmissionId', () => {
    test('should find submission by DocuSeal submission ID', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-789',
          email: 'user@example.com',
          submission_id: 54321,
          submission_url: 'https://docuseal.co/s/xyz789',
          audit_log_url: 'https://docuseal.co/audit/xyz789',
          status: 'pending',
          user_id: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.findBySubmissionId(54321);

      expect(submission).toBeDefined();
      expect(submission.submissionId).toBe(54321);
      expect(submission.email).toBe('user@example.com');
    });

    test('should return null if submission not found', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const submission = await DocusealSubmission.findBySubmissionId(99999);

      expect(submission).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.findBySubmissionId(12345)).rejects.toThrow('Query error');
    });
  });

  describe('findByEmail', () => {
    test('should find all submissions for an email', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'investor@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/aaa',
            audit_log_url: 'https://docuseal.co/audit/aaa',
            status: 'completed',
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'submission-2',
            email: 'investor@example.com',
            submission_id: 22222,
            submission_url: 'https://docuseal.co/s/bbb',
            audit_log_url: 'https://docuseal.co/audit/bbb',
            status: 'pending',
            user_id: 'user-123',
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.findByEmail('investor@example.com');

      expect(submissions).toHaveLength(2);
      expect(submissions[0].email).toBe('investor@example.com');
      expect(submissions[1].email).toBe('investor@example.com');
      expect(submissions[0].submissionId).toBe(11111);
      expect(submissions[1].submissionId).toBe(22222);
    });

    test('should convert email to lowercase when searching', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'test@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/test',
            audit_log_url: 'https://docuseal.co/audit/test',
            status: 'pending',
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.findByEmail('TEST@EXAMPLE.COM');

      expect(submissions).toHaveLength(1);
      expect(submissions[0].email).toBe('test@example.com');
    });

    test('should return empty array if no submissions found', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [],
        error: null,
      });

      const submissions = await DocusealSubmission.findByEmail('nosubmissions@example.com');

      expect(submissions).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.findByEmail('test@example.com')).rejects.toThrow('Query error');
    });
  });

  describe('find', () => {
    test('should find all submissions when no criteria provided', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'user1@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/aaa',
            audit_log_url: 'https://docuseal.co/audit/aaa',
            status: 'completed',
            user_id: 'user-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'submission-2',
            email: 'user2@example.com',
            submission_id: 22222,
            submission_url: 'https://docuseal.co/s/bbb',
            audit_log_url: 'https://docuseal.co/audit/bbb',
            status: 'pending',
            user_id: 'user-2',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.find();

      expect(submissions).toHaveLength(2);
      expect(submissions[0].id).toBe('submission-1');
      expect(submissions[1].id).toBe('submission-2');
    });

    test('should find submissions by status', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'user1@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/aaa',
            audit_log_url: 'https://docuseal.co/audit/aaa',
            status: 'completed',
            user_id: 'user-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.find({ status: 'completed' });

      expect(submissions).toHaveLength(1);
      expect(submissions[0].status).toBe('completed');
    });

    test('should find submissions by userId', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'user@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/aaa',
            audit_log_url: 'https://docuseal.co/audit/aaa',
            status: 'pending',
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.find({ userId: 'user-123' });

      expect(submissions).toHaveLength(1);
      expect(submissions[0].userId).toBe('user-123');
    });

    test('should find submissions by multiple criteria', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [
          {
            id: 'submission-1',
            email: 'user@example.com',
            submission_id: 11111,
            submission_url: 'https://docuseal.co/s/aaa',
            audit_log_url: 'https://docuseal.co/audit/aaa',
            status: 'completed',
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const submissions = await DocusealSubmission.find({
        userId: 'user-123',
        status: 'completed'
      });

      expect(submissions).toHaveLength(1);
      expect(submissions[0].userId).toBe('user-123');
      expect(submissions[0].status).toBe('completed');
    });

    test('should return empty array if no submissions found', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: [],
        error: null,
      });

      const submissions = await DocusealSubmission.find({ status: 'nonexistent' });

      expect(submissions).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.find()).rejects.toThrow('Query error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update submission status', async () => {
      const updateData = {
        status: 'completed',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-123',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/abc123',
          status: 'completed',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await DocusealSubmission.findByIdAndUpdate('submission-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.status).toBe('completed');
      expect(updated.id).toBe('submission-123');
    });

    test('should update submission URL and audit log URL', async () => {
      const updateData = {
        submissionURL: 'https://docuseal.co/s/updated',
        auditLogUrl: 'https://docuseal.co/audit/updated',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-456',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/updated',
          audit_log_url: 'https://docuseal.co/audit/updated',
          status: 'pending',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await DocusealSubmission.findByIdAndUpdate('submission-456', updateData);

      expect(updated.submissionURL).toBe('https://docuseal.co/s/updated');
      expect(updated.auditLogUrl).toBe('https://docuseal.co/audit/updated');
    });

    test('should update multiple fields', async () => {
      const updateData = {
        status: 'expired',
        auditLogUrl: 'https://docuseal.co/audit/final',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-789',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/final',
          status: 'expired',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await DocusealSubmission.findByIdAndUpdate('submission-789', updateData);

      expect(updated.status).toBe('expired');
      expect(updated.auditLogUrl).toBe('https://docuseal.co/audit/final');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(
        DocusealSubmission.findByIdAndUpdate('submission-123', { status: 'completed' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete submission successfully', async () => {
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-123',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/abc123',
          status: 'completed',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await DocusealSubmission.findByIdAndDelete('submission-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('submission-123');
      expect(deleted.submissionId).toBe(12345);
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('docuseal_submissions', {
        data: null,
        error: error,
      });

      await expect(DocusealSubmission.findByIdAndDelete('submission-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'submission-123',
        email: 'user@example.com',
        submissionId: 12345,
        submissionURL: 'https://docuseal.co/s/abc123',
        auditLogUrl: 'https://docuseal.co/audit/abc123',
        status: 'pending',
        userId: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = DocusealSubmission._toDbFields(modelData);

      expect(dbData.id).toBe('submission-123');
      expect(dbData.email).toBe('user@example.com');
      expect(dbData.submission_id).toBe(12345);
      expect(dbData.submission_url).toBe('https://docuseal.co/s/abc123');
      expect(dbData.audit_log_url).toBe('https://docuseal.co/audit/abc123');
      expect(dbData.status).toBe('pending');
      expect(dbData.user_id).toBe('user-123');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'submission-123',
        email: 'user@example.com',
        submission_id: 12345,
        submission_url: 'https://docuseal.co/s/abc123',
        audit_log_url: 'https://docuseal.co/audit/abc123',
        status: 'completed',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const modelData = DocusealSubmission._toModel(dbData);

      expect(modelData.id).toBe('submission-123');
      expect(modelData.email).toBe('user@example.com');
      expect(modelData.submissionId).toBe(12345);
      expect(modelData.submissionURL).toBe('https://docuseal.co/s/abc123');
      expect(modelData.auditLogUrl).toBe('https://docuseal.co/audit/abc123');
      expect(modelData.status).toBe('completed');
      expect(modelData.userId).toBe('user-456');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = DocusealSubmission._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        email: 'partial@example.com',
        submissionId: 99999,
      };

      const dbData = DocusealSubmission._toDbFields(partialData);

      expect(dbData.email).toBe('partial@example.com');
      expect(dbData.submission_id).toBe(99999);
      expect(dbData.id).toBeUndefined();
      expect(dbData.status).toBeUndefined();
    });
  });

  describe('Submission statuses', () => {
    test('should handle pending status', async () => {
      const submissionData = {
        email: 'user@example.com',
        submissionId: 12345,
        status: 'pending',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-pending',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: null,
          audit_log_url: null,
          status: 'pending',
          user_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.create(submissionData);

      expect(submission.status).toBe('pending');
    });

    test('should handle completed status', async () => {
      const submissionData = {
        email: 'user@example.com',
        submissionId: 12345,
        status: 'completed',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-completed',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: 'https://docuseal.co/audit/abc123',
          status: 'completed',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.create(submissionData);

      expect(submission.status).toBe('completed');
    });

    test('should handle expired status', async () => {
      const submissionData = {
        email: 'user@example.com',
        submissionId: 12345,
        status: 'expired',
      };

      mockSupabase.setMockResponse('docuseal_submissions', {
        data: {
          id: 'submission-expired',
          email: 'user@example.com',
          submission_id: 12345,
          submission_url: 'https://docuseal.co/s/abc123',
          audit_log_url: null,
          status: 'expired',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
        error: null,
      });

      const submission = await DocusealSubmission.create(submissionData);

      expect(submission.status).toBe('expired');
    });
  });
});
