/**
 * EmailDomain Model Tests
 * Tests for src/models/supabase/emailDomain.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const EmailDomain = require('../../src/models/supabase/emailDomain');

describe('EmailDomain Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new email domain successfully', async () => {
      const domainData = {
        resendDomainId: 'resend-domain-123',
        domainName: 'example.com',
        region: 'us-east-1',
        dnsRecords: [
          { type: 'TXT', name: '_resend', value: 'verification-token' },
          { type: 'MX', name: '@', value: 'mx.resend.com' }
        ],
        fromEmail: 'noreply@example.com',
        fromName: 'Example Inc',
        replyToEmail: 'support@example.com',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'example.com',
          status: 'pending',
          region: 'us-east-1',
          dns_records: [
            { type: 'TXT', name: '_resend', value: 'verification-token' },
            { type: 'MX', name: '@', value: 'mx.resend.com' }
          ],
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const domain = await EmailDomain.create(domainData);

      expect(domain).toBeDefined();
      expect(domain.id).toBe('domain-123');
      expect(domain.resendDomainId).toBe('resend-domain-123');
      expect(domain.domainName).toBe('example.com');
      expect(domain.status).toBe('pending');
      expect(domain.region).toBe('us-east-1');
      expect(domain.dnsRecords).toHaveLength(2);
      expect(domain.fromEmail).toBe('noreply@example.com');
      expect(domain.fromName).toBe('Example Inc');
      expect(domain.replyToEmail).toBe('support@example.com');
      expect(domain.isActive).toBe(true);
      expect(domain.createdAt).toBeDefined();
      expect(domain.updatedAt).toBeDefined();
    });

    test('should create domain with default pending status', async () => {
      const domainData = {
        resendDomainId: 'resend-domain-456',
        domainName: 'test.com',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-456',
          resend_domain_id: 'resend-domain-456',
          domain_name: 'test.com',
          status: 'pending',
          region: null,
          dns_records: null,
          from_email: null,
          from_name: null,
          reply_to_email: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const domain = await EmailDomain.create(domainData);

      expect(domain.status).toBe('pending');
      expect(domain.isActive).toBe(true);
    });

    test('should throw error if creation fails', async () => {
      const domainData = {
        resendDomainId: 'resend-domain-123',
        domainName: 'example.com',
      };

      const error = new Error('Duplicate domain name');
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.create(domainData)).rejects.toThrow(
        'Error creating email domain: Duplicate domain name'
      );
    });
  });

  describe('findById', () => {
    test('should find email domain by ID successfully', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'example.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const domain = await EmailDomain.findById('domain-123');

      expect(domain).toBeDefined();
      expect(domain.id).toBe('domain-123');
      expect(domain.domainName).toBe('example.com');
      expect(domain.status).toBe('verified');
    });

    test('should return null if domain not found', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const domain = await EmailDomain.findById('nonexistent-id');

      expect(domain).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Connection error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.findById('domain-123')).rejects.toThrow(
        'Error finding email domain: Connection error'
      );
    });
  });

  describe('findByResendDomainId', () => {
    test('should find email domain by Resend domain ID', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-789',
          resend_domain_id: 'resend-domain-789',
          domain_name: 'mail.example.com',
          status: 'verified',
          region: 'eu-west-1',
          dns_records: [],
          from_email: 'info@mail.example.com',
          from_name: 'Mail Service',
          reply_to_email: 'info@mail.example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const domain = await EmailDomain.findByResendDomainId('resend-domain-789');

      expect(domain).toBeDefined();
      expect(domain.resendDomainId).toBe('resend-domain-789');
      expect(domain.domainName).toBe('mail.example.com');
    });

    test('should return null if domain not found', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const domain = await EmailDomain.findByResendDomainId('nonexistent-resend-id');

      expect(domain).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.findByResendDomainId('resend-123')).rejects.toThrow(
        'Error finding email domain: Query error'
      );
    });
  });

  describe('findByDomainName', () => {
    test('should find email domain by domain name', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-abc',
          resend_domain_id: 'resend-domain-abc',
          domain_name: 'company.com',
          status: 'verified',
          region: 'us-west-2',
          dns_records: [],
          from_email: 'hello@company.com',
          from_name: 'Company',
          reply_to_email: 'hello@company.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const domain = await EmailDomain.findByDomainName('company.com');

      expect(domain).toBeDefined();
      expect(domain.domainName).toBe('company.com');
    });

    test('should convert domain name to lowercase when searching', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-abc',
          resend_domain_id: 'resend-domain-abc',
          domain_name: 'company.com',
          status: 'verified',
          region: 'us-west-2',
          dns_records: [],
          from_email: 'hello@company.com',
          from_name: 'Company',
          reply_to_email: 'hello@company.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const domain = await EmailDomain.findByDomainName('COMPANY.COM');

      expect(domain).toBeDefined();
      expect(domain.domainName).toBe('company.com');
    });

    test('should return null if domain not found', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const domain = await EmailDomain.findByDomainName('notfound.com');

      expect(domain).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.findByDomainName('test.com')).rejects.toThrow(
        'Error finding email domain: Query error'
      );
    });
  });

  describe('findAll', () => {
    test('should find all email domains ordered by creation date', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: [
          {
            id: 'domain-1',
            resend_domain_id: 'resend-1',
            domain_name: 'domain1.com',
            status: 'verified',
            region: 'us-east-1',
            dns_records: [],
            from_email: 'noreply@domain1.com',
            from_name: 'Domain 1',
            reply_to_email: 'support@domain1.com',
            is_active: true,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            verified_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'domain-2',
            resend_domain_id: 'resend-2',
            domain_name: 'domain2.com',
            status: 'pending',
            region: 'us-east-1',
            dns_records: [],
            from_email: 'noreply@domain2.com',
            from_name: 'Domain 2',
            reply_to_email: 'support@domain2.com',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            verified_at: null,
          },
        ],
        error: null,
      });

      const domains = await EmailDomain.findAll();

      expect(domains).toHaveLength(2);
      expect(domains[0].domainName).toBe('domain1.com');
      expect(domains[1].domainName).toBe('domain2.com');
    });

    test('should return empty array if no domains found', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: [],
        error: null,
      });

      const domains = await EmailDomain.findAll();

      expect(domains).toEqual([]);
    });

    test('should handle null data', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: null,
      });

      const domains = await EmailDomain.findAll();

      expect(domains).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.findAll()).rejects.toThrow(
        'Error finding email domains: Query error'
      );
    });
  });

  describe('findVerified', () => {
    test('should find only verified and active domains', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: [
          {
            id: 'domain-verified-1',
            resend_domain_id: 'resend-v1',
            domain_name: 'verified1.com',
            status: 'verified',
            region: 'us-east-1',
            dns_records: [],
            from_email: 'noreply@verified1.com',
            from_name: 'Verified 1',
            reply_to_email: 'support@verified1.com',
            is_active: true,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            verified_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'domain-verified-2',
            resend_domain_id: 'resend-v2',
            domain_name: 'verified2.com',
            status: 'verified',
            region: 'us-east-1',
            dns_records: [],
            from_email: 'noreply@verified2.com',
            from_name: 'Verified 2',
            reply_to_email: 'support@verified2.com',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            verified_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const domains = await EmailDomain.findVerified();

      expect(domains).toHaveLength(2);
      expect(domains[0].status).toBe('verified');
      expect(domains[0].isActive).toBe(true);
      expect(domains[1].status).toBe('verified');
      expect(domains[1].isActive).toBe(true);
    });

    test('should return empty array if no verified domains', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: [],
        error: null,
      });

      const domains = await EmailDomain.findVerified();

      expect(domains).toEqual([]);
    });

    test('should handle null data', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: null,
      });

      const domains = await EmailDomain.findVerified();

      expect(domains).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.findVerified()).rejects.toThrow(
        'Error finding verified domains: Query error'
      );
    });
  });

  describe('update', () => {
    test('should update email domain successfully', async () => {
      const updateData = {
        fromEmail: 'updated@example.com',
        fromName: 'Updated Name',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'example.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'updated@example.com',
          from_name: 'Updated Name',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const updated = await EmailDomain.update('domain-123', updateData);

      expect(updated.fromEmail).toBe('updated@example.com');
      expect(updated.fromName).toBe('Updated Name');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(
        EmailDomain.update('domain-123', { fromEmail: 'test@example.com' })
      ).rejects.toThrow('Error updating email domain: Update failed');
    });
  });

  describe('updateStatus', () => {
    test('should update status to verified and set verifiedAt timestamp', async () => {
      const dnsRecords = [
        { type: 'TXT', name: '_resend', value: 'verified-token', status: 'verified' }
      ];

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'example.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: dnsRecords,
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await EmailDomain.updateStatus('domain-123', 'verified', dnsRecords);

      expect(updated.status).toBe('verified');
      expect(updated.verifiedAt).toBeDefined();
      expect(updated.dnsRecords).toEqual(dnsRecords);
    });

    test('should update status to failed', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-456',
          resend_domain_id: 'resend-domain-456',
          domain_name: 'failed.com',
          status: 'failed',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'noreply@failed.com',
          from_name: 'Failed Domain',
          reply_to_email: 'support@failed.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const updated = await EmailDomain.updateStatus('domain-456', 'failed');

      expect(updated.status).toBe('failed');
      expect(updated.verifiedAt).toBeNull();
    });

    test('should update DNS records without changing status', async () => {
      const newDnsRecords = [
        { type: 'TXT', name: '_resend', value: 'new-token' }
      ];

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-789',
          resend_domain_id: 'resend-domain-789',
          domain_name: 'test.com',
          status: 'pending',
          region: 'us-east-1',
          dns_records: newDnsRecords,
          from_email: 'noreply@test.com',
          from_name: 'Test',
          reply_to_email: 'support@test.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const updated = await EmailDomain.updateStatus('domain-789', 'pending', newDnsRecords);

      expect(updated.status).toBe('pending');
      expect(updated.dnsRecords).toEqual(newDnsRecords);
    });
  });

  describe('updateEmailConfig', () => {
    test('should update email configuration fields', async () => {
      const emailConfig = {
        fromEmail: 'new@example.com',
        fromName: 'New Name',
        replyToEmail: 'reply@example.com',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'example.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'new@example.com',
          from_name: 'New Name',
          reply_to_email: 'reply@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const updated = await EmailDomain.updateEmailConfig('domain-123', emailConfig);

      expect(updated.fromEmail).toBe('new@example.com');
      expect(updated.fromName).toBe('New Name');
      expect(updated.replyToEmail).toBe('reply@example.com');
    });
  });

  describe('delete', () => {
    test('should delete email domain successfully', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'deleted.com',
          status: 'pending',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'noreply@deleted.com',
          from_name: 'Deleted',
          reply_to_email: 'support@deleted.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const deleted = await EmailDomain.delete('domain-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('domain-123');
      expect(deleted.domainName).toBe('deleted.com');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: error,
      });

      await expect(EmailDomain.delete('domain-123')).rejects.toThrow(
        'Error deleting email domain: Deletion failed'
      );
    });
  });

  describe('exists', () => {
    test('should return true if domain exists', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-123',
          resend_domain_id: 'resend-domain-123',
          domain_name: 'exists.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'noreply@exists.com',
          from_name: 'Exists',
          reply_to_email: 'support@exists.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const exists = await EmailDomain.exists('exists.com');

      expect(exists).toBe(true);
    });

    test('should return false if domain does not exist', async () => {
      mockSupabase.setMockResponse('email_domains', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const exists = await EmailDomain.exists('notfound.com');

      expect(exists).toBe(false);
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'domain-123',
        resendDomainId: 'resend-123',
        domainName: 'example.com',
        status: 'verified',
        region: 'us-east-1',
        dnsRecords: [{ type: 'TXT' }],
        fromEmail: 'noreply@example.com',
        fromName: 'Example',
        replyToEmail: 'support@example.com',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        verifiedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = EmailDomain._toDbFields(modelData);

      expect(dbData.id).toBe('domain-123');
      expect(dbData.resend_domain_id).toBe('resend-123');
      expect(dbData.domain_name).toBe('example.com');
      expect(dbData.status).toBe('verified');
      expect(dbData.region).toBe('us-east-1');
      expect(dbData.dns_records).toEqual([{ type: 'TXT' }]);
      expect(dbData.from_email).toBe('noreply@example.com');
      expect(dbData.from_name).toBe('Example');
      expect(dbData.reply_to_email).toBe('support@example.com');
      expect(dbData.is_active).toBe(true);
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.verified_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'domain-456',
        resend_domain_id: 'resend-456',
        domain_name: 'test.com',
        status: 'pending',
        region: 'eu-west-1',
        dns_records: [{ type: 'MX' }],
        from_email: 'noreply@test.com',
        from_name: 'Test',
        reply_to_email: 'support@test.com',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        verified_at: null,
      };

      const modelData = EmailDomain._toModel(dbData);

      expect(modelData.id).toBe('domain-456');
      expect(modelData.resendDomainId).toBe('resend-456');
      expect(modelData.domainName).toBe('test.com');
      expect(modelData.status).toBe('pending');
      expect(modelData.region).toBe('eu-west-1');
      expect(modelData.dnsRecords).toEqual([{ type: 'MX' }]);
      expect(modelData.fromEmail).toBe('noreply@test.com');
      expect(modelData.fromName).toBe('Test');
      expect(modelData.replyToEmail).toBe('support@test.com');
      expect(modelData.isActive).toBe(true);
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-02T00:00:00Z');
      expect(modelData.verifiedAt).toBeNull();
    });

    test('should handle null values in transformation', () => {
      const modelData = EmailDomain._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        resendDomainId: 'resend-partial',
        domainName: 'partial.com',
      };

      const dbData = EmailDomain._toDbFields(partialData);

      expect(dbData.resend_domain_id).toBe('resend-partial');
      expect(dbData.domain_name).toBe('partial.com');
      expect(dbData.id).toBeUndefined();
      expect(dbData.status).toBeUndefined();
    });
  });

  describe('Domain statuses', () => {
    test('should handle pending status', async () => {
      const domainData = {
        resendDomainId: 'resend-pending',
        domainName: 'pending.com',
        status: 'pending',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-pending',
          resend_domain_id: 'resend-pending',
          domain_name: 'pending.com',
          status: 'pending',
          region: null,
          dns_records: null,
          from_email: null,
          from_name: null,
          reply_to_email: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const domain = await EmailDomain.create(domainData);

      expect(domain.status).toBe('pending');
      expect(domain.verifiedAt).toBeNull();
    });

    test('should handle verified status', async () => {
      const domainData = {
        resendDomainId: 'resend-verified',
        domainName: 'verified.com',
        status: 'verified',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-verified',
          resend_domain_id: 'resend-verified',
          domain_name: 'verified.com',
          status: 'verified',
          region: 'us-east-1',
          dns_records: [],
          from_email: 'noreply@verified.com',
          from_name: 'Verified',
          reply_to_email: 'support@verified.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const domain = await EmailDomain.create(domainData);

      expect(domain.status).toBe('verified');
    });

    test('should handle failed status', async () => {
      const domainData = {
        resendDomainId: 'resend-failed',
        domainName: 'failed.com',
        status: 'failed',
      };

      mockSupabase.setMockResponse('email_domains', {
        data: {
          id: 'domain-failed',
          resend_domain_id: 'resend-failed',
          domain_name: 'failed.com',
          status: 'failed',
          region: 'us-east-1',
          dns_records: [],
          from_email: null,
          from_name: null,
          reply_to_email: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          verified_at: null,
        },
        error: null,
      });

      const domain = await EmailDomain.create(domainData);

      expect(domain.status).toBe('failed');
      expect(domain.verifiedAt).toBeNull();
    });
  });
});
