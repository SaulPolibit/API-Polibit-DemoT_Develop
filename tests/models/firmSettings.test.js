/**
 * FirmSettings Model Tests
 * Tests for src/models/supabase/firmSettings.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const FirmSettings = require('../../src/models/supabase/firmSettings');

describe('FirmSettings Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create firm settings successfully', async () => {
      const settingsData = {
        firmName: 'Acme Capital',
        firmLogo: 'https://example.com/logo.png',
        firmDescription: 'A leading investment firm',
        firmWebsite: 'https://acmecapital.com',
        firmAddress: '123 Wall St, New York, NY 10005',
        firmPhone: '+1-555-0123',
        firmEmail: 'info@acmecapital.com',
        userId: 'user-123',
      };

      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Acme Capital',
          firm_logo: 'https://example.com/logo.png',
          firm_description: 'A leading investment firm',
          firm_website: 'https://acmecapital.com',
          firm_address: '123 Wall St, New York, NY 10005',
          firm_phone: '+1-555-0123',
          firm_email: 'info@acmecapital.com',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.create(settingsData);

      expect(settings).toBeDefined();
      expect(settings.id).toBe('settings-123');
      expect(settings.firmName).toBe('Acme Capital');
      expect(settings.firmLogo).toBe('https://example.com/logo.png');
      expect(settings.firmDescription).toBe('A leading investment firm');
      expect(settings.firmWebsite).toBe('https://acmecapital.com');
      expect(settings.firmAddress).toBe('123 Wall St, New York, NY 10005');
      expect(settings.firmPhone).toBe('+1-555-0123');
      expect(settings.firmEmail).toBe('info@acmecapital.com');
      expect(settings.userId).toBe('user-123');
      expect(settings.createdAt).toBeDefined();
      expect(settings.updatedAt).toBeDefined();
    });

    test('should create firm settings with minimal fields', async () => {
      const settingsData = {
        firmName: 'Simple Firm',
      };

      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-456',
          firm_name: 'Simple Firm',
          firm_logo: null,
          firm_description: null,
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.create(settingsData);

      expect(settings).toBeDefined();
      expect(settings.firmName).toBe('Simple Firm');
    });

    test('should throw error if creation fails', async () => {
      const settingsData = {
        firmName: 'Test Firm',
      };

      const error = new Error('Database constraint violation');
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.create(settingsData)).rejects.toThrow('Database constraint violation');
    });
  });

  describe('get', () => {
    test('should get firm settings successfully', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Global Ventures',
          firm_logo: 'https://example.com/logo.png',
          firm_description: 'Investment firm',
          firm_website: 'https://globalventures.com',
          firm_address: '456 Market St',
          firm_phone: '+1-555-4567',
          firm_email: 'contact@globalventures.com',
          user_id: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.get();

      expect(settings).toBeDefined();
      expect(settings.id).toBe('settings-123');
      expect(settings.firmName).toBe('Global Ventures');
    });

    test('should return null if no settings found', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const settings = await FirmSettings.get();

      expect(settings).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Connection error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.get()).rejects.toThrow('Connection error');
    });
  });

  describe('findByUserId', () => {
    test('should find firm settings by user ID', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-789',
          firm_name: 'User Firm',
          firm_logo: null,
          firm_description: 'User-specific firm',
          firm_website: 'https://userfirm.com',
          firm_address: null,
          firm_phone: null,
          firm_email: 'user@firm.com',
          user_id: 'user-789',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.findByUserId('user-789');

      expect(settings).toBeDefined();
      expect(settings.userId).toBe('user-789');
      expect(settings.firmName).toBe('User Firm');
    });

    test('should return null if no settings found for user', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const settings = await FirmSettings.findByUserId('nonexistent-user');

      expect(settings).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Query error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.findByUserId('user-123')).rejects.toThrow('Query error');
    });
  });

  describe('findById', () => {
    test('should find firm settings by ID', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-abc',
          firm_name: 'ABC Investments',
          firm_logo: 'https://example.com/abc-logo.png',
          firm_description: 'Premium investment services',
          firm_website: 'https://abcinvest.com',
          firm_address: '789 Finance Ave',
          firm_phone: '+1-555-7890',
          firm_email: 'hello@abcinvest.com',
          user_id: 'user-abc',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.findById('settings-abc');

      expect(settings).toBeDefined();
      expect(settings.id).toBe('settings-abc');
      expect(settings.firmName).toBe('ABC Investments');
    });

    test('should return null if settings not found', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const settings = await FirmSettings.findById('nonexistent-id');

      expect(settings).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      error.code = 'DB_ERROR';
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.findById('settings-123')).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    test('should update existing firm settings', async () => {
      const updateData = {
        firmName: 'Updated Firm Name',
        firmWebsite: 'https://updated.com',
      };

      // First call to get() returns existing settings
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Old Firm Name',
          firm_logo: null,
          firm_description: null,
          firm_website: 'https://old.com',
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Second call updates the settings
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Updated Firm Name',
          firm_logo: null,
          firm_description: null,
          firm_website: 'https://updated.com',
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await FirmSettings.update(updateData);

      expect(updated.firmName).toBe('Updated Firm Name');
      expect(updated.firmWebsite).toBe('https://updated.com');
    });

    test('should create settings if none exist', async () => {
      const updateData = {
        firmName: 'New Firm',
        firmEmail: 'new@firm.com',
      };

      // get() returns null (no existing settings)
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      // create() is called
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-new',
          firm_name: 'New Firm',
          firm_logo: null,
          firm_description: null,
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: 'new@firm.com',
          user_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const created = await FirmSettings.update(updateData);

      expect(created.firmName).toBe('New Firm');
      expect(created.firmEmail).toBe('new@firm.com');
    });

    test('should throw error if update fails', async () => {
      // get() returns existing settings
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Test Firm',
        },
        error: null,
      });

      // update fails
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.update({ firmName: 'New Name' })).rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update firm settings by ID', async () => {
      const updateData = {
        firmName: 'Updated by ID',
        firmLogo: 'https://example.com/new-logo.png',
      };

      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-456',
          firm_name: 'Updated by ID',
          firm_logo: 'https://example.com/new-logo.png',
          firm_description: 'Existing description',
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await FirmSettings.findByIdAndUpdate('settings-456', updateData);

      expect(updated.id).toBe('settings-456');
      expect(updated.firmName).toBe('Updated by ID');
      expect(updated.firmLogo).toBe('https://example.com/new-logo.png');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update error');
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(
        FirmSettings.findByIdAndUpdate('settings-123', { firmName: 'Test' })
      ).rejects.toThrow('Update error');
    });
  });

  describe('delete', () => {
    test('should delete firm settings successfully', async () => {
      // get() returns existing settings
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-delete',
          firm_name: 'To Be Deleted',
          firm_logo: null,
          firm_description: null,
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-delete',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // delete returns deleted record
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-delete',
          firm_name: 'To Be Deleted',
          firm_logo: null,
          firm_description: null,
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-delete',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await FirmSettings.delete();

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('settings-delete');
      expect(deleted.firmName).toBe('To Be Deleted');
    });

    test('should throw error if no settings found to delete', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(FirmSettings.delete()).rejects.toThrow('No firm settings found to delete');
    });

    test('should throw error if deletion fails', async () => {
      // get() returns existing settings
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-123',
          firm_name: 'Test',
        },
        error: null,
      });

      // delete fails
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.delete()).rejects.toThrow('Deletion failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete firm settings by ID', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-789',
          firm_name: 'Deleted Firm',
          firm_logo: null,
          firm_description: null,
          firm_website: null,
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-789',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await FirmSettings.findByIdAndDelete('settings-789');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('settings-789');
      expect(deleted.firmName).toBe('Deleted Firm');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Delete error');
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: error,
      });

      await expect(FirmSettings.findByIdAndDelete('settings-123')).rejects.toThrow('Delete error');
    });
  });

  describe('initializeDefaults', () => {
    test('should return existing settings if they exist', async () => {
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-existing',
          firm_name: 'Existing Firm',
          firm_logo: null,
          firm_description: 'Existing description',
          firm_website: 'https://existing.com',
          firm_address: null,
          firm_phone: null,
          firm_email: null,
          user_id: 'user-existing',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.initializeDefaults();

      expect(settings).toBeDefined();
      expect(settings.id).toBe('settings-existing');
      expect(settings.firmName).toBe('Existing Firm');
    });

    test('should create default settings if none exist', async () => {
      // get() returns null
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      // create() is called with defaults
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-default',
          firm_name: 'My Firm',
          firm_logo: null,
          firm_description: '',
          firm_website: '',
          firm_address: '',
          firm_phone: '',
          firm_email: '',
          user_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.initializeDefaults();

      expect(settings).toBeDefined();
      expect(settings.firmName).toBe('My Firm');
      expect(settings.firmDescription).toBe('');
    });

    test('should create default settings with userId if provided', async () => {
      // get() returns null
      mockSupabase.setMockResponse('firm_settings', {
        data: null,
        error: { code: 'PGRST116' },
      });

      // create() is called with defaults and userId
      mockSupabase.setMockResponse('firm_settings', {
        data: {
          id: 'settings-default-user',
          firm_name: 'My Firm',
          firm_logo: null,
          firm_description: '',
          firm_website: '',
          firm_address: '',
          firm_phone: '',
          firm_email: '',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const settings = await FirmSettings.initializeDefaults('user-123');

      expect(settings).toBeDefined();
      expect(settings.firmName).toBe('My Firm');
      expect(settings.userId).toBe('user-123');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'settings-123',
        firmName: 'Test Firm',
        firmLogo: 'https://example.com/logo.png',
        firmDescription: 'A test firm',
        firmWebsite: 'https://testfirm.com',
        firmAddress: '123 Test St',
        firmPhone: '+1-555-1234',
        firmEmail: 'test@firm.com',
        userId: 'user-456',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = FirmSettings._toDbFields(modelData);

      expect(dbData.id).toBe('settings-123');
      expect(dbData.firm_name).toBe('Test Firm');
      expect(dbData.firm_logo).toBe('https://example.com/logo.png');
      expect(dbData.firm_description).toBe('A test firm');
      expect(dbData.firm_website).toBe('https://testfirm.com');
      expect(dbData.firm_address).toBe('123 Test St');
      expect(dbData.firm_phone).toBe('+1-555-1234');
      expect(dbData.firm_email).toBe('test@firm.com');
      expect(dbData.user_id).toBe('user-456');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'settings-789',
        firm_name: 'Another Firm',
        firm_logo: 'https://example.com/another-logo.png',
        firm_description: 'Another description',
        firm_website: 'https://anotherfirm.com',
        firm_address: '456 Another St',
        firm_phone: '+1-555-5678',
        firm_email: 'another@firm.com',
        user_id: 'user-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const modelData = FirmSettings._toModel(dbData);

      expect(modelData.id).toBe('settings-789');
      expect(modelData.firmName).toBe('Another Firm');
      expect(modelData.firmLogo).toBe('https://example.com/another-logo.png');
      expect(modelData.firmDescription).toBe('Another description');
      expect(modelData.firmWebsite).toBe('https://anotherfirm.com');
      expect(modelData.firmAddress).toBe('456 Another St');
      expect(modelData.firmPhone).toBe('+1-555-5678');
      expect(modelData.firmEmail).toBe('another@firm.com');
      expect(modelData.userId).toBe('user-789');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = FirmSettings._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        firmName: 'Partial Firm',
        firmEmail: 'partial@firm.com',
      };

      const dbData = FirmSettings._toDbFields(partialData);

      expect(dbData.firm_name).toBe('Partial Firm');
      expect(dbData.firm_email).toBe('partial@firm.com');
      expect(dbData.id).toBeUndefined();
      expect(dbData.firm_logo).toBeUndefined();
    });
  });
});
