/**
 * EmailLog Model Tests
 * Tests for src/models/supabase/emailLog.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const EmailLog = require('../../src/models/supabase/emailLog');

describe('EmailLog Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new email log successfully', async () => {
      const logData = {
        userId: 'user-123',
        emailSettingsId: 'settings-456',
        toAddresses: ['recipient@example.com'],
        ccAddresses: ['cc@example.com'],
        bccAddresses: ['bcc@example.com'],
        subject: 'Test Email',
        bodyText: 'This is a test email',
        bodyHtml: '<p>This is a test email</p>',
        hasAttachments: true,
        attachmentCount: 2,
        status: 'sent',
        messageId: 'msg-789',
        sentAt: '2024-01-01T12:00:00Z',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-123',
          user_id: 'user-123',
          email_settings_id: 'settings-456',
          to_addresses: ['recipient@example.com'],
          cc_addresses: ['cc@example.com'],
          bcc_addresses: ['bcc@example.com'],
          subject: 'Test Email',
          body_text: 'This is a test email',
          body_html: '<p>This is a test email</p>',
          has_attachments: true,
          attachment_count: 2,
          status: 'sent',
          error_message: null,
          message_id: 'msg-789',
          sent_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log).toBeDefined();
      expect(log.id).toBe('log-123');
      expect(log.userId).toBe('user-123');
      expect(log.emailSettingsId).toBe('settings-456');
      expect(log.toAddresses).toEqual(['recipient@example.com']);
      expect(log.ccAddresses).toEqual(['cc@example.com']);
      expect(log.bccAddresses).toEqual(['bcc@example.com']);
      expect(log.subject).toBe('Test Email');
      expect(log.bodyText).toBe('This is a test email');
      expect(log.bodyHtml).toBe('<p>This is a test email</p>');
      expect(log.hasAttachments).toBe(true);
      expect(log.attachmentCount).toBe(2);
      expect(log.status).toBe('sent');
      expect(log.messageId).toBe('msg-789');
      expect(log.sentAt).toBe('2024-01-01T12:00:00Z');
      expect(log.createdAt).toBeDefined();
    });

    test('should create email log with minimal fields', async () => {
      const logData = {
        userId: 'user-456',
        toAddresses: ['test@example.com'],
        subject: 'Simple Email',
        status: 'queued',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-456',
          user_id: 'user-456',
          email_settings_id: null,
          to_addresses: ['test@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Simple Email',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'queued',
          error_message: null,
          message_id: null,
          sent_at: null,
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log).toBeDefined();
      expect(log.id).toBe('log-456');
      expect(log.userId).toBe('user-456');
      expect(log.toAddresses).toEqual(['test@example.com']);
      expect(log.subject).toBe('Simple Email');
      expect(log.status).toBe('queued');
      expect(log.hasAttachments).toBe(false);
      expect(log.attachmentCount).toBe(0);
    });

    test('should create failed email log with error message', async () => {
      const logData = {
        userId: 'user-789',
        toAddresses: ['failed@example.com'],
        subject: 'Failed Email',
        status: 'failed',
        errorMessage: 'SMTP connection failed',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-789',
          user_id: 'user-789',
          email_settings_id: null,
          to_addresses: ['failed@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Failed Email',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'failed',
          error_message: 'SMTP connection failed',
          message_id: null,
          sent_at: null,
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.status).toBe('failed');
      expect(log.errorMessage).toBe('SMTP connection failed');
    });

    test('should throw error if creation fails', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['test@example.com'],
        subject: 'Test',
        status: 'sent',
      };

      const error = new Error('Database error');
      mockSupabase.setMockResponse('email_logs', {
        data: null,
        error: error,
      });

      await expect(EmailLog.create(logData)).rejects.toThrow(
        'Error creating email log: Database error'
      );
    });
  });

  describe('findById', () => {
    test('should find email log by ID successfully', async () => {
      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-123',
          user_id: 'user-123',
          email_settings_id: 'settings-456',
          to_addresses: ['recipient@example.com'],
          cc_addresses: [],
          bcc_addresses: [],
          subject: 'Test Email',
          body_text: 'Test content',
          body_html: '<p>Test content</p>',
          has_attachments: false,
          attachment_count: 0,
          status: 'sent',
          error_message: null,
          message_id: 'msg-123',
          sent_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.findById('log-123');

      expect(log).toBeDefined();
      expect(log.id).toBe('log-123');
      expect(log.userId).toBe('user-123');
      expect(log.subject).toBe('Test Email');
      expect(log.status).toBe('sent');
    });

    test('should return null if log not found', async () => {
      mockSupabase.setMockResponse('email_logs', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const log = await EmailLog.findById('nonexistent-id');

      expect(log).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Connection error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('email_logs', {
        data: null,
        error: error,
      });

      await expect(EmailLog.findById('log-123')).rejects.toThrow(
        'Error finding email log: Connection error'
      );
    });
  });

  describe('findByUserId', () => {
    test('should find email logs by user ID with default options', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'log-1',
              user_id: 'user-123',
              email_settings_id: 'settings-1',
              to_addresses: ['test1@example.com'],
              cc_addresses: [],
              bcc_addresses: [],
              subject: 'Email 1',
              body_text: 'Content 1',
              body_html: '<p>Content 1</p>',
              has_attachments: false,
              attachment_count: 0,
              status: 'sent',
              error_message: null,
              message_id: 'msg-1',
              sent_at: '2024-01-02T12:00:00Z',
              created_at: '2024-01-02T12:00:00Z',
            },
            {
              id: 'log-2',
              user_id: 'user-123',
              email_settings_id: 'settings-1',
              to_addresses: ['test2@example.com'],
              cc_addresses: [],
              bcc_addresses: [],
              subject: 'Email 2',
              body_text: 'Content 2',
              body_html: '<p>Content 2</p>',
              has_attachments: false,
              attachment_count: 0,
              status: 'sent',
              error_message: null,
              message_id: 'msg-2',
              sent_at: '2024-01-01T12:00:00Z',
              created_at: '2024-01-01T12:00:00Z',
            },
          ],
          count: 2,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const result = await EmailLog.findByUserId('user-123');

      expect(result.logs).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.total).toBe(2);
      expect(result.logs[0].id).toBe('log-1');
      expect(result.logs[1].id).toBe('log-2');
    });

    test('should filter by status', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'log-failed',
              user_id: 'user-123',
              email_settings_id: 'settings-1',
              to_addresses: ['failed@example.com'],
              cc_addresses: [],
              bcc_addresses: [],
              subject: 'Failed Email',
              body_text: 'Content',
              body_html: '<p>Content</p>',
              has_attachments: false,
              attachment_count: 0,
              status: 'failed',
              error_message: 'SMTP error',
              message_id: null,
              sent_at: null,
              created_at: '2024-01-01T12:00:00Z',
            },
          ],
          count: 1,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const result = await EmailLog.findByUserId('user-123', { status: 'failed' });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].status).toBe('failed');
      expect(result.logs[0].errorMessage).toBe('SMTP error');
    });

    test('should filter by date range', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'log-dated',
              user_id: 'user-123',
              email_settings_id: 'settings-1',
              to_addresses: ['dated@example.com'],
              cc_addresses: [],
              bcc_addresses: [],
              subject: 'Dated Email',
              body_text: 'Content',
              body_html: '<p>Content</p>',
              has_attachments: false,
              attachment_count: 0,
              status: 'sent',
              error_message: null,
              message_id: 'msg-dated',
              sent_at: '2024-01-15T12:00:00Z',
              created_at: '2024-01-15T12:00:00Z',
            },
          ],
          count: 1,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const result = await EmailLog.findByUserId('user-123', {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].sentAt).toBe('2024-01-15T12:00:00Z');
    });

    test('should apply pagination with limit and offset', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'log-3',
              user_id: 'user-123',
              email_settings_id: 'settings-1',
              to_addresses: ['page2@example.com'],
              cc_addresses: [],
              bcc_addresses: [],
              subject: 'Page 2 Email',
              body_text: 'Content',
              body_html: '<p>Content</p>',
              has_attachments: false,
              attachment_count: 0,
              status: 'sent',
              error_message: null,
              message_id: 'msg-3',
              sent_at: '2024-01-01T12:00:00Z',
              created_at: '2024-01-01T12:00:00Z',
            },
          ],
          count: 100,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const result = await EmailLog.findByUserId('user-123', {
        limit: 10,
        offset: 10,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.total).toBe(100);
    });

    test('should return empty logs array if no logs found', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const result = await EmailLog.findByUserId('user-new');

      expect(result.logs).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.total).toBe(0);
    });

    test('should throw error on database failure', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query error'),
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(selectQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      await expect(EmailLog.findByUserId('user-123')).rejects.toThrow(
        'Error finding email logs: Query error'
      );
    });
  });

  describe('getStatistics', () => {
    test('should calculate statistics for last 30 days by default', async () => {
      mockSupabase.setMockResponse('email_logs', {
        data: [
          { status: 'sent' },
          { status: 'sent' },
          { status: 'sent' },
          { status: 'failed' },
          { status: 'failed' },
          { status: 'queued' },
        ],
        error: null,
      });

      const stats = await EmailLog.getStatistics('user-123');

      expect(stats).toBeDefined();
      expect(stats.total).toBe(6);
      expect(stats.sent).toBe(3);
      expect(stats.failed).toBe(2);
      expect(stats.queued).toBe(1);
      expect(stats.period).toBe('Last 30 days');
    });

    test('should calculate statistics for custom day range', async () => {
      mockSupabase.setMockResponse('email_logs', {
        data: [
          { status: 'sent' },
          { status: 'sent' },
          { status: 'failed' },
        ],
        error: null,
      });

      const stats = await EmailLog.getStatistics('user-123', 7);

      expect(stats).toBeDefined();
      expect(stats.total).toBe(3);
      expect(stats.sent).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.queued).toBe(0);
      expect(stats.period).toBe('Last 7 days');
    });

    test('should return zero statistics if no logs found', async () => {
      mockSupabase.setMockResponse('email_logs', {
        data: [],
        error: null,
      });

      const stats = await EmailLog.getStatistics('user-new');

      expect(stats.total).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.queued).toBe(0);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('email_logs', {
        data: null,
        error: error,
      });

      await expect(EmailLog.getStatistics('user-123')).rejects.toThrow(
        'Error getting statistics: Database error'
      );
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'log-123',
        userId: 'user-456',
        emailSettingsId: 'settings-789',
        toAddresses: ['to@example.com'],
        ccAddresses: ['cc@example.com'],
        bccAddresses: ['bcc@example.com'],
        subject: 'Test Subject',
        bodyText: 'Plain text body',
        bodyHtml: '<p>HTML body</p>',
        hasAttachments: true,
        attachmentCount: 3,
        status: 'sent',
        errorMessage: 'Error details',
        messageId: 'msg-123',
        sentAt: '2024-01-01T12:00:00Z',
        createdAt: '2024-01-01T12:00:00Z',
      };

      const dbData = EmailLog._toDbFields(modelData);

      expect(dbData.id).toBe('log-123');
      expect(dbData.user_id).toBe('user-456');
      expect(dbData.email_settings_id).toBe('settings-789');
      expect(dbData.to_addresses).toEqual(['to@example.com']);
      expect(dbData.cc_addresses).toEqual(['cc@example.com']);
      expect(dbData.bcc_addresses).toEqual(['bcc@example.com']);
      expect(dbData.subject).toBe('Test Subject');
      expect(dbData.body_text).toBe('Plain text body');
      expect(dbData.body_html).toBe('<p>HTML body</p>');
      expect(dbData.has_attachments).toBe(true);
      expect(dbData.attachment_count).toBe(3);
      expect(dbData.status).toBe('sent');
      expect(dbData.error_message).toBe('Error details');
      expect(dbData.message_id).toBe('msg-123');
      expect(dbData.sent_at).toBe('2024-01-01T12:00:00Z');
      expect(dbData.created_at).toBe('2024-01-01T12:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'log-456',
        user_id: 'user-789',
        email_settings_id: 'settings-abc',
        to_addresses: ['recipient@example.com'],
        cc_addresses: ['cc@example.com'],
        bcc_addresses: ['bcc@example.com'],
        subject: 'Email Subject',
        body_text: 'Text content',
        body_html: '<p>HTML content</p>',
        has_attachments: false,
        attachment_count: 0,
        status: 'failed',
        error_message: 'Failed to send',
        message_id: 'msg-456',
        sent_at: '2024-01-02T12:00:00Z',
        created_at: '2024-01-02T12:00:00Z',
      };

      const modelData = EmailLog._toModel(dbData);

      expect(modelData.id).toBe('log-456');
      expect(modelData.userId).toBe('user-789');
      expect(modelData.emailSettingsId).toBe('settings-abc');
      expect(modelData.toAddresses).toEqual(['recipient@example.com']);
      expect(modelData.ccAddresses).toEqual(['cc@example.com']);
      expect(modelData.bccAddresses).toEqual(['bcc@example.com']);
      expect(modelData.subject).toBe('Email Subject');
      expect(modelData.bodyText).toBe('Text content');
      expect(modelData.bodyHtml).toBe('<p>HTML content</p>');
      expect(modelData.hasAttachments).toBe(false);
      expect(modelData.attachmentCount).toBe(0);
      expect(modelData.status).toBe('failed');
      expect(modelData.errorMessage).toBe('Failed to send');
      expect(modelData.messageId).toBe('msg-456');
      expect(modelData.sentAt).toBe('2024-01-02T12:00:00Z');
      expect(modelData.createdAt).toBe('2024-01-02T12:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = EmailLog._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle null address arrays with defaults', () => {
      const dbData = {
        id: 'log-789',
        user_id: 'user-123',
        email_settings_id: null,
        to_addresses: null,
        cc_addresses: null,
        bcc_addresses: null,
        subject: 'Test',
        body_text: null,
        body_html: null,
        has_attachments: null,
        attachment_count: null,
        status: 'queued',
        error_message: null,
        message_id: null,
        sent_at: null,
        created_at: '2024-01-01T12:00:00Z',
      };

      const modelData = EmailLog._toModel(dbData);

      expect(modelData.toAddresses).toEqual([]);
      expect(modelData.ccAddresses).toEqual([]);
      expect(modelData.bccAddresses).toEqual([]);
      expect(modelData.hasAttachments).toBe(false);
      expect(modelData.attachmentCount).toBe(0);
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        userId: 'user-123',
        toAddresses: ['test@example.com'],
        subject: 'Partial Email',
        status: 'sent',
      };

      const dbData = EmailLog._toDbFields(partialData);

      expect(dbData.user_id).toBe('user-123');
      expect(dbData.to_addresses).toEqual(['test@example.com']);
      expect(dbData.subject).toBe('Partial Email');
      expect(dbData.status).toBe('sent');
      expect(dbData.id).toBeUndefined();
      expect(dbData.message_id).toBeUndefined();
    });
  });

  describe('Email statuses', () => {
    test('should handle sent status', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['sent@example.com'],
        subject: 'Sent Email',
        status: 'sent',
        messageId: 'msg-sent',
        sentAt: '2024-01-01T12:00:00Z',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-sent',
          user_id: 'user-123',
          email_settings_id: null,
          to_addresses: ['sent@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Sent Email',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'sent',
          error_message: null,
          message_id: 'msg-sent',
          sent_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.status).toBe('sent');
      expect(log.messageId).toBe('msg-sent');
      expect(log.sentAt).toBeDefined();
      expect(log.errorMessage).toBeNull();
    });

    test('should handle failed status with error message', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['failed@example.com'],
        subject: 'Failed Email',
        status: 'failed',
        errorMessage: 'Recipient address rejected',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-failed',
          user_id: 'user-123',
          email_settings_id: null,
          to_addresses: ['failed@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Failed Email',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'failed',
          error_message: 'Recipient address rejected',
          message_id: null,
          sent_at: null,
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.status).toBe('failed');
      expect(log.errorMessage).toBe('Recipient address rejected');
      expect(log.messageId).toBeNull();
      expect(log.sentAt).toBeNull();
    });

    test('should handle queued status', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['queued@example.com'],
        subject: 'Queued Email',
        status: 'queued',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-queued',
          user_id: 'user-123',
          email_settings_id: null,
          to_addresses: ['queued@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Queued Email',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'queued',
          error_message: null,
          message_id: null,
          sent_at: null,
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.status).toBe('queued');
      expect(log.messageId).toBeNull();
      expect(log.sentAt).toBeNull();
      expect(log.errorMessage).toBeNull();
    });
  });

  describe('Attachment handling', () => {
    test('should track emails with attachments', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['attach@example.com'],
        subject: 'Email with attachments',
        hasAttachments: true,
        attachmentCount: 3,
        status: 'sent',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-attach',
          user_id: 'user-123',
          email_settings_id: null,
          to_addresses: ['attach@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Email with attachments',
          body_text: null,
          body_html: null,
          has_attachments: true,
          attachment_count: 3,
          status: 'sent',
          error_message: null,
          message_id: 'msg-attach',
          sent_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.hasAttachments).toBe(true);
      expect(log.attachmentCount).toBe(3);
    });

    test('should handle emails without attachments', async () => {
      const logData = {
        userId: 'user-123',
        toAddresses: ['noattach@example.com'],
        subject: 'Email without attachments',
        hasAttachments: false,
        attachmentCount: 0,
        status: 'sent',
      };

      mockSupabase.setMockResponse('email_logs', {
        data: {
          id: 'log-noattach',
          user_id: 'user-123',
          email_settings_id: null,
          to_addresses: ['noattach@example.com'],
          cc_addresses: null,
          bcc_addresses: null,
          subject: 'Email without attachments',
          body_text: null,
          body_html: null,
          has_attachments: false,
          attachment_count: 0,
          status: 'sent',
          error_message: null,
          message_id: 'msg-noattach',
          sent_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      const log = await EmailLog.create(logData);

      expect(log.hasAttachments).toBe(false);
      expect(log.attachmentCount).toBe(0);
    });
  });
});
