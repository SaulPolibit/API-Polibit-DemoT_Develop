/**
 * EmailSettings Model Tests
 * Tests for src/models/supabase/emailSettings.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

// Mock encryption utilities
jest.mock('../../src/utils/encryption', () => ({
  encrypt: jest.fn((password) => `encrypted_${password}`),
  decrypt: jest.fn((encryptedPassword) => {
    if (encryptedPassword && encryptedPassword.startsWith('encrypted_')) {
      return encryptedPassword.replace('encrypted_', '');
    }
    throw new Error('Invalid encrypted format');
  }),
}));

const { getSupabase } = require('../../src/config/database');
const { encrypt, decrypt } = require('../../src/utils/encryption');
const EmailSettings = require('../../src/models/supabase/emailSettings');

describe('EmailSettings Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    test('should create new email settings when none exist', async () => {
      const settingsData = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUsername: 'user@example.com',
        smtpPassword: 'secret123',
        fromEmail: 'noreply@example.com',
        fromName: 'Example Inc',
        replyToEmail: 'support@example.com',
        isActive: true,
      };

      // First call to findByUserId returns null (no existing settings)
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      // Second call creates the settings
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'user@example.com',
          smtp_password: 'encrypted_secret123',
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.upsert('user-456', settingsData);

      expect(encrypt).toHaveBeenCalledWith('secret123');
      expect(settings).toBeDefined();
      expect(settings.id).toBe('settings-123');
      expect(settings.userId).toBe('user-456');
      expect(settings.smtpHost).toBe('smtp.gmail.com');
      expect(settings.smtpPort).toBe(587);
      expect(settings.smtpSecure).toBe(true);
      expect(settings.smtpUsername).toBe('user@example.com');
      expect(settings.fromEmail).toBe('noreply@example.com');
      expect(settings.fromName).toBe('Example Inc');
      expect(settings.replyToEmail).toBe('support@example.com');
      expect(settings.isActive).toBe(true);
      expect(settings.smtpPassword).toBeUndefined(); // Password excluded by default
    });

    test('should update existing email settings', async () => {
      const settingsData = {
        smtpHost: 'smtp.updated.com',
        smtpPort: 465,
        smtpPassword: 'newsecret456',
      };

      // First call to findByUserId returns existing settings
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-789',
          user_id: 'user-789',
          smtp_host: 'smtp.old.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'old@example.com',
          smtp_password: 'encrypted_oldsecret',
          from_email: 'old@example.com',
          from_name: 'Old Name',
          reply_to_email: 'old@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      // Second call updates the settings
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-789',
          user_id: 'user-789',
          smtp_host: 'smtp.updated.com',
          smtp_port: 465,
          smtp_secure: true,
          smtp_username: 'old@example.com',
          smtp_password: 'encrypted_newsecret456',
          from_email: 'old@example.com',
          from_name: 'Old Name',
          reply_to_email: 'old@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.upsert('user-789', settingsData);

      expect(encrypt).toHaveBeenCalledWith('newsecret456');
      expect(settings.smtpHost).toBe('smtp.updated.com');
      expect(settings.smtpPort).toBe(465);
      expect(settings.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    test('should throw error if creation fails', async () => {
      const settingsData = {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpPassword: 'secret',
      };

      // Need to mock sequential calls: findByUserId (returns null), then insert (fails)
      const findQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(findQuery)
          .mockReturnValueOnce(insertQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      await expect(EmailSettings.upsert('user-123', settingsData)).rejects.toThrow(
        'Error creating email settings: Database error'
      );
    });

    test('should throw error if update fails', async () => {
      const settingsData = {
        smtpHost: 'smtp.example.com',
      };

      // Need to mock sequential calls: findByUserId (returns existing), then update (fails)
      const findQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'settings-123',
            user_id: 'user-123',
            smtp_host: 'old.smtp.com',
            smtp_port: 587,
          },
          error: null,
        }),
      };

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed'),
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(findQuery)
          .mockReturnValueOnce(updateQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      await expect(EmailSettings.upsert('user-123', settingsData)).rejects.toThrow(
        'Error updating email settings: Update failed'
      );
    });
  });

  describe('findByUserId', () => {
    test('should find email settings by user ID without password', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'user@example.com',
          smtp_password: 'encrypted_secret123',
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.findByUserId('user-456');

      expect(settings).toBeDefined();
      expect(settings.userId).toBe('user-456');
      expect(settings.smtpHost).toBe('smtp.gmail.com');
      expect(settings.smtpPassword).toBeUndefined(); // Password excluded by default
    });

    test('should find email settings with password when includePassword is true', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-789',
          user_id: 'user-789',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'user@example.com',
          smtp_password: 'encrypted_secret123',
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.findByUserId('user-789', true);

      expect(settings).toBeDefined();
      expect(settings.smtpPassword).toBe('encrypted_secret123'); // Password included
    });

    test('should return null if settings not found', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const settings = await EmailSettings.findByUserId('user-nonexistent');

      expect(settings).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Connection error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: error,
      });

      await expect(EmailSettings.findByUserId('user-123')).rejects.toThrow(
        'Error finding email settings: Connection error'
      );
    });
  });

  describe('getDecryptedPassword', () => {
    test('should decrypt and return password', async () => {
      decrypt.mockReturnValueOnce('mysecretpassword');

      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'user@example.com',
          smtp_password: 'encrypted_mysecretpassword',
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const password = await EmailSettings.getDecryptedPassword('user-456');

      expect(decrypt).toHaveBeenCalledWith('encrypted_mysecretpassword');
      expect(password).toBe('mysecretpassword');
    });

    test('should return null if settings not found', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const password = await EmailSettings.getDecryptedPassword('user-nonexistent');

      expect(password).toBeNull();
    });

    test('should return null if password not set', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_password: null,
        },
        error: null,
      });

      const password = await EmailSettings.getDecryptedPassword('user-456');

      expect(password).toBeNull();
    });

    test('should throw error if decryption fails', async () => {
      decrypt.mockImplementationOnce(() => {
        throw new Error('Decryption error');
      });

      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_password: 'invalid_encrypted_data',
        },
        error: null,
      });

      await expect(EmailSettings.getDecryptedPassword('user-456')).rejects.toThrow(
        'Failed to decrypt password'
      );
    });
  });

  describe('updateLastUsed', () => {
    test('should update last used timestamp', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: null,
      });

      const result = await EmailSettings.updateLastUsed('user-123');

      expect(result).toBe(true);
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: error,
      });

      await expect(EmailSettings.updateLastUsed('user-123')).rejects.toThrow(
        'Error updating last used: Update failed'
      );
    });
  });

  describe('delete', () => {
    test('should delete email settings successfully', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: 'user@example.com',
          smtp_password: 'encrypted_secret',
          from_email: 'noreply@example.com',
          from_name: 'Example Inc',
          reply_to_email: 'support@example.com',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const deleted = await EmailSettings.delete('user-456');

      expect(deleted).toBeDefined();
      expect(deleted.userId).toBe('user-456');
      expect(deleted.smtpHost).toBe('smtp.gmail.com');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: error,
      });

      await expect(EmailSettings.delete('user-123')).rejects.toThrow(
        'Error deleting email settings: Deletion failed'
      );
    });
  });

  describe('hasSettings', () => {
    test('should return true if user has settings', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
        },
        error: null,
      });

      const hasSettings = await EmailSettings.hasSettings('user-456');

      expect(hasSettings).toBe(true);
    });

    test('should return false if user has no settings', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const hasSettings = await EmailSettings.hasSettings('user-nonexistent');

      expect(hasSettings).toBe(false);
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'settings-123',
        userId: 'user-456',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUsername: 'user@example.com',
        smtpPassword: 'encrypted_secret',
        fromEmail: 'noreply@example.com',
        fromName: 'Example Inc',
        replyToEmail: 'support@example.com',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-02T00:00:00Z',
      };

      const dbData = EmailSettings._toDbFields(modelData);

      expect(dbData.id).toBe('settings-123');
      expect(dbData.user_id).toBe('user-456');
      expect(dbData.smtp_host).toBe('smtp.gmail.com');
      expect(dbData.smtp_port).toBe(587);
      expect(dbData.smtp_secure).toBe(true);
      expect(dbData.smtp_username).toBe('user@example.com');
      expect(dbData.smtp_password).toBe('encrypted_secret');
      expect(dbData.from_email).toBe('noreply@example.com');
      expect(dbData.from_name).toBe('Example Inc');
      expect(dbData.reply_to_email).toBe('support@example.com');
      expect(dbData.is_active).toBe(true);
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.last_used_at).toBe('2024-01-02T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase without password', () => {
      const dbData = {
        id: 'settings-456',
        user_id: 'user-789',
        smtp_host: 'smtp.office365.com',
        smtp_port: 587,
        smtp_secure: false,
        smtp_username: 'office@example.com',
        smtp_password: 'encrypted_secret',
        from_email: 'info@example.com',
        from_name: 'Info Team',
        reply_to_email: 'info@example.com',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        last_used_at: '2024-01-03T00:00:00Z',
      };

      const modelData = EmailSettings._toModel(dbData, false);

      expect(modelData.id).toBe('settings-456');
      expect(modelData.userId).toBe('user-789');
      expect(modelData.smtpHost).toBe('smtp.office365.com');
      expect(modelData.smtpPort).toBe(587);
      expect(modelData.smtpSecure).toBe(false);
      expect(modelData.smtpUsername).toBe('office@example.com');
      expect(modelData.smtpPassword).toBeUndefined(); // Excluded
      expect(modelData.fromEmail).toBe('info@example.com');
      expect(modelData.fromName).toBe('Info Team');
      expect(modelData.replyToEmail).toBe('info@example.com');
      expect(modelData.isActive).toBe(true);
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-02T00:00:00Z');
      expect(modelData.lastUsedAt).toBe('2024-01-03T00:00:00Z');
    });

    test('should include password when includePassword is true', () => {
      const dbData = {
        id: 'settings-789',
        user_id: 'user-abc',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_password: 'encrypted_mypassword',
      };

      const modelData = EmailSettings._toModel(dbData, true);

      expect(modelData.smtpPassword).toBe('encrypted_mypassword');
    });

    test('should handle null values in transformation', () => {
      const modelData = EmailSettings._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        userId: 'user-123',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
      };

      const dbData = EmailSettings._toDbFields(partialData);

      expect(dbData.user_id).toBe('user-123');
      expect(dbData.smtp_host).toBe('smtp.example.com');
      expect(dbData.smtp_port).toBe(587);
      expect(dbData.id).toBeUndefined();
      expect(dbData.from_email).toBeUndefined();
    });
  });

  describe('SMTP security settings', () => {
    test('should handle secure SMTP (SSL/TLS)', async () => {
      const settingsData = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUsername: 'user@gmail.com',
        smtpPassword: 'secret',
      };

      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-ssl',
          user_id: 'user-123',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 465,
          smtp_secure: true,
          smtp_username: 'user@gmail.com',
          smtp_password: 'encrypted_secret',
          from_email: null,
          from_name: null,
          reply_to_email: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.upsert('user-123', settingsData);

      expect(settings.smtpSecure).toBe(true);
      expect(settings.smtpPort).toBe(465);
    });

    test('should handle non-secure SMTP (STARTTLS)', async () => {
      const settingsData = {
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUsername: 'user@outlook.com',
        smtpPassword: 'secret',
      };

      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-tls',
          user_id: 'user-456',
          smtp_host: 'smtp.office365.com',
          smtp_port: 587,
          smtp_secure: false,
          smtp_username: 'user@outlook.com',
          smtp_password: 'encrypted_secret',
          from_email: null,
          from_name: null,
          reply_to_email: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
        },
        error: null,
      });

      const settings = await EmailSettings.upsert('user-456', settingsData);

      expect(settings.smtpSecure).toBe(false);
      expect(settings.smtpPort).toBe(587);
    });
  });

  describe('Password encryption', () => {
    test('should encrypt password before storing', async () => {
      const settingsData = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpPassword: 'myplaintextpassword',
      };

      mockSupabase.setMockResponse('user_email_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_password: 'encrypted_myplaintextpassword',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      await EmailSettings.upsert('user-456', settingsData);

      expect(encrypt).toHaveBeenCalledWith('myplaintextpassword');
    });

    test('should not include password in default response', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_host: 'smtp.gmail.com',
          smtp_password: 'encrypted_secret',
        },
        error: null,
      });

      const settings = await EmailSettings.findByUserId('user-456', false);

      expect(settings.smtpPassword).toBeUndefined();
    });

    test('should only include encrypted password when explicitly requested', async () => {
      mockSupabase.setMockResponse('user_email_settings', {
        data: {
          id: 'settings-123',
          user_id: 'user-456',
          smtp_password: 'encrypted_secret',
        },
        error: null,
      });

      const settings = await EmailSettings.findByUserId('user-456', true);

      expect(settings.smtpPassword).toBe('encrypted_secret');
      expect(decrypt).not.toHaveBeenCalled(); // Encryption utilities not called during findByUserId
    });
  });
});
