/**
 * Tests for NotificationSettings Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const NotificationSettings = require('../../../src/models/supabase/notificationSettings');

describe('NotificationSettings Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create notification settings successfully', async () => {
      const settingsData = {
        userId: 'user-123',
        emailNotifications: true,
        portfolioNotifications: true,
        reportNotifications: false
      };

      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-123',
        email_notifications: true,
        portfolio_notifications: true,
        report_notifications: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.create(settingsData);

      expect(result.id).toBe('settings-123');
      expect(result.userId).toBe('user-123');
      expect(result.emailNotifications).toBe(true);
      expect(result.portfolioNotifications).toBe(true);
      expect(result.reportNotifications).toBe(false);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.create({})).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find notification settings by ID successfully', async () => {
      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-456',
        email_notifications: true,
        push_notifications: false
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-123');

      expect(result.id).toBe('settings-123');
      expect(result.userId).toBe('user-456');
      expect(result.emailNotifications).toBe(true);
      expect(result.pushNotifications).toBe(false);
    });

    test('should return null if settings not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      const result = await NotificationSettings.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.findById('settings-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    test('should find notification settings by user ID', async () => {
      const dbResponse = {
        id: 'settings-789',
        user_id: 'user-123',
        email_notifications: true,
        sms_notifications: false
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findByUserId('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.emailNotifications).toBe(true);
      expect(result.smsNotifications).toBe(false);
    });

    test('should return null if user has no settings', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      const result = await NotificationSettings.findByUserId('user-new');
      expect(result).toBeNull();
    });
  });

  describe('findOrCreateByUserId', () => {
    test('should return existing settings if found', async () => {
      const dbResponse = {
        id: 'settings-existing',
        user_id: 'user-123',
        email_notifications: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findOrCreateByUserId('user-123');

      expect(result.id).toBe('settings-existing');
      expect(result.userId).toBe('user-123');
    });

    test('should create new settings if not found', async () => {
      // First call returns null (not found)
      const notFoundError = new Error('Not found');
      notFoundError.code = 'PGRST116';

      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: notFoundError
      });

      // Second call creates new settings
      const createResponse = {
        id: 'settings-new',
        user_id: 'user-new',
        email_notifications: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: createResponse,
        error: null
      });

      const result = await NotificationSettings.findOrCreateByUserId('user-new');

      expect(result.id).toBe('settings-new');
      expect(result.userId).toBe('user-new');
    });
  });

  describe('updateByUserId', () => {
    test('should update settings by user ID successfully', async () => {
      const updates = {
        emailNotifications: false,
        pushNotifications: true
      };

      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-456',
        email_notifications: false,
        push_notifications: true,
        updated_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.updateByUserId('user-456', updates);

      expect(result.userId).toBe('user-456');
      expect(result.emailNotifications).toBe(false);
      expect(result.pushNotifications).toBe(true);
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.updateByUserId('user-123', {})).rejects.toThrow('Database error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update settings by ID successfully', async () => {
      const updates = {
        portfolioNotifications: true,
        reportNotifications: false
      };

      const dbResponse = {
        id: 'settings-123',
        portfolio_notifications: true,
        report_notifications: false
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findByIdAndUpdate('settings-123', updates);

      expect(result.id).toBe('settings-123');
      expect(result.portfolioNotifications).toBe(true);
      expect(result.reportNotifications).toBe(false);
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.findByIdAndUpdate('settings-123', {})).rejects.toThrow('Database error');
    });
  });

  describe('findOneAndUpdate', () => {
    test('should update existing settings when found', async () => {
      const filter = { userId: 'user-123' };
      const updates = { emailNotifications: false };

      // Mock find query
      const existingResponse = {
        id: 'settings-123',
        user_id: 'user-123',
        email_notifications: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: existingResponse,
        error: null
      });

      // Mock update query
      const updateResponse = {
        id: 'settings-123',
        user_id: 'user-123',
        email_notifications: false
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: updateResponse,
        error: null
      });

      const result = await NotificationSettings.findOneAndUpdate(filter, updates);

      expect(result.emailNotifications).toBe(false);
    });

    test('should upsert when upsert option is true', async () => {
      const filter = { userId: 'user-new' };
      const updates = { emailNotifications: true };

      const upsertResponse = {
        id: 'settings-new',
        user_id: 'user-new',
        email_notifications: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: upsertResponse,
        error: null
      });

      const result = await NotificationSettings.findOneAndUpdate(filter, updates, { upsert: true });

      expect(result.userId).toBe('user-new');
      expect(result.emailNotifications).toBe(true);
    });

    test('should return null if not found and upsert is false', async () => {
      const filter = { userId: 'user-nonexistent' };
      const updates = { emailNotifications: true };

      const notFoundError = new Error('Not found');
      notFoundError.code = 'PGRST116';

      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: notFoundError
      });

      const result = await NotificationSettings.findOneAndUpdate(filter, updates);

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete settings successfully', async () => {
      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-456'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findByIdAndDelete('settings-123');

      expect(result.id).toBe('settings-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.findByIdAndDelete('settings-123')).rejects.toThrow('Database error');
    });
  });

  describe('findOneAndDelete', () => {
    test('should delete settings by criteria', async () => {
      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-456'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findOneAndDelete({ userId: 'user-456' });

      expect(result.userId).toBe('user-456');
    });

    test('should return null if settings not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      const result = await NotificationSettings.findOneAndDelete({ userId: 'nonexistent' });
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('notification_settings', {
        data: null,
        error: error
      });

      await expect(NotificationSettings.findOneAndDelete({ userId: 'user-123' })).rejects.toThrow('Database error');
    });
  });

  describe('Instance methods', () => {
    describe('isNotificationEnabled', () => {
      test('should return true for enabled notification type', async () => {
        const dbResponse = {
          id: 'settings-123',
          user_id: 'user-456',
          email_notifications: true,
          push_notifications: false
        };

        mockSupabase.setMockResponse('notification_settings', {
          data: dbResponse,
          error: null
        });

        const settings = await NotificationSettings.findById('settings-123');

        expect(settings.isNotificationEnabled('emailNotifications')).toBe(true);
        expect(settings.isNotificationEnabled('pushNotifications')).toBe(false);
      });
    });

    describe('enableAll', () => {
      test('should enable all notifications', async () => {
        const initialDbResponse = {
          id: 'settings-123',
          user_id: 'user-456',
          email_notifications: false,
          push_notifications: false
        };

        mockSupabase.setMockResponse('notification_settings', {
          data: initialDbResponse,
          error: null
        });

        const settings = await NotificationSettings.findById('settings-123');

        const updatedDbResponse = {
          id: 'settings-123',
          user_id: 'user-456',
          email_notifications: true,
          portfolio_notifications: true,
          report_notifications: true,
          investor_activity_notifications: true,
          system_update_notifications: true,
          marketing_email_notifications: true,
          push_notifications: true,
          sms_notifications: true,
          document_uploads: true,
          general_announcements: true,
          capital_call_notices: true,
          distribution_notices: true,
          k1_tax_forms: true,
          payment_confirmations: true,
          quarterly_reports: true,
          security_alerts: true,
          urgent_capital_calls: true
        };

        mockSupabase.setMockResponse('notification_settings', {
          data: updatedDbResponse,
          error: null
        });

        const updated = await settings.enableAll();

        expect(updated.emailNotifications).toBe(true);
        expect(updated.pushNotifications).toBe(true);
        expect(updated.portfolioNotifications).toBe(true);
        expect(updated.capitalCallNotices).toBe(true);
      });
    });

    describe('disableAll', () => {
      test('should disable all notifications', async () => {
        const initialDbResponse = {
          id: 'settings-123',
          user_id: 'user-456',
          email_notifications: true,
          push_notifications: true
        };

        mockSupabase.setMockResponse('notification_settings', {
          data: initialDbResponse,
          error: null
        });

        const settings = await NotificationSettings.findById('settings-123');

        const updatedDbResponse = {
          id: 'settings-123',
          user_id: 'user-456',
          email_notifications: false,
          portfolio_notifications: false,
          report_notifications: false,
          investor_activity_notifications: false,
          system_update_notifications: false,
          marketing_email_notifications: false,
          push_notifications: false,
          sms_notifications: false,
          document_uploads: false,
          general_announcements: false,
          capital_call_notices: false,
          distribution_notices: false,
          k1_tax_forms: false,
          payment_confirmations: false,
          quarterly_reports: false,
          security_alerts: false,
          urgent_capital_calls: false
        };

        mockSupabase.setMockResponse('notification_settings', {
          data: updatedDbResponse,
          error: null
        });

        const updated = await settings.disableAll();

        expect(updated.emailNotifications).toBe(false);
        expect(updated.pushNotifications).toBe(false);
        expect(updated.portfolioNotifications).toBe(false);
        expect(updated.capitalCallNotices).toBe(false);
      });
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const settingsData = {
        userId: 'user-123',
        emailNotifications: true,
        portfolioNotifications: false,
        reportNotifications: true,
        investorActivityNotifications: false,
        systemUpdateNotifications: true,
        marketingEmailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
        notificationFrequency: 'daily',
        preferredContactMethod: 'email',
        reportDeliveryFormat: 'pdf',
        documentUploads: true,
        generalAnnouncements: false,
        capitalCallNotices: true,
        distributionNotices: true,
        k1TaxForms: false,
        paymentConfirmations: true,
        quarterlyReports: false,
        securityAlerts: true,
        urgentCapitalCalls: true
      };

      const dbResponse = {
        id: 'settings-123',
        user_id: 'user-123',
        email_notifications: true,
        portfolio_notifications: false,
        report_notifications: true,
        investor_activity_notifications: false,
        system_update_notifications: true,
        marketing_email_notifications: false,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'daily',
        preferred_contact_method: 'email',
        report_delivery_format: 'pdf',
        document_uploads: true,
        general_announcements: false,
        capital_call_notices: true,
        distribution_notices: true,
        k1_tax_forms: false,
        payment_confirmations: true,
        quarterly_reports: false,
        security_alerts: true,
        urgent_capital_calls: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.create(settingsData);

      expect(result.userId).toBe('user-123');
      expect(result.emailNotifications).toBe(true);
      expect(result.portfolioNotifications).toBe(false);
      expect(result.notificationFrequency).toBe('daily');
      expect(result.preferredContactMethod).toBe('email');
      expect(result.capitalCallNotices).toBe(true);
      expect(result.k1TaxForms).toBe(false);
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'settings-456',
        user_id: 'user-789',
        email_notifications: false,
        portfolio_notifications: true,
        push_notifications: false,
        capital_call_notices: true,
        distribution_notices: false,
        k1_tax_forms: true,
        notification_frequency: 'weekly',
        preferred_contact_method: 'sms',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-456');

      expect(result.userId).toBe('user-789');
      expect(result.emailNotifications).toBe(false);
      expect(result.portfolioNotifications).toBe(true);
      expect(result.pushNotifications).toBe(false);
      expect(result.capitalCallNotices).toBe(true);
      expect(result.distributionNotices).toBe(false);
      expect(result.k1TaxForms).toBe(true);
      expect(result.notificationFrequency).toBe('weekly');
      expect(result.preferredContactMethod).toBe('sms');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-20T10:00:00Z');
    });
  });

  describe('Notification types', () => {
    test('should handle all notification type fields', async () => {
      const dbResponse = {
        id: 'settings-all',
        user_id: 'user-all',
        email_notifications: true,
        portfolio_notifications: true,
        report_notifications: true,
        investor_activity_notifications: true,
        system_update_notifications: true,
        marketing_email_notifications: false,
        push_notifications: true,
        sms_notifications: false,
        document_uploads: true,
        general_announcements: true,
        capital_call_notices: true,
        distribution_notices: true,
        k1_tax_forms: true,
        payment_confirmations: true,
        quarterly_reports: true,
        security_alerts: true,
        urgent_capital_calls: true
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-all');

      expect(result.emailNotifications).toBe(true);
      expect(result.portfolioNotifications).toBe(true);
      expect(result.reportNotifications).toBe(true);
      expect(result.investorActivityNotifications).toBe(true);
      expect(result.systemUpdateNotifications).toBe(true);
      expect(result.marketingEmailNotifications).toBe(false);
      expect(result.pushNotifications).toBe(true);
      expect(result.smsNotifications).toBe(false);
      expect(result.documentUploads).toBe(true);
      expect(result.generalAnnouncements).toBe(true);
      expect(result.capitalCallNotices).toBe(true);
      expect(result.distributionNotices).toBe(true);
      expect(result.k1TaxForms).toBe(true);
      expect(result.paymentConfirmations).toBe(true);
      expect(result.quarterlyReports).toBe(true);
      expect(result.securityAlerts).toBe(true);
      expect(result.urgentCapitalCalls).toBe(true);
    });
  });

  describe('Notification preferences', () => {
    test('should handle notification frequency options', async () => {
      const dbResponse = {
        id: 'settings-freq',
        user_id: 'user-freq',
        notification_frequency: 'immediate'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-freq');
      expect(result.notificationFrequency).toBe('immediate');
    });

    test('should handle preferred contact method', async () => {
      const dbResponse = {
        id: 'settings-contact',
        user_id: 'user-contact',
        preferred_contact_method: 'push'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-contact');
      expect(result.preferredContactMethod).toBe('push');
    });

    test('should handle report delivery format', async () => {
      const dbResponse = {
        id: 'settings-report',
        user_id: 'user-report',
        report_delivery_format: 'excel'
      };

      mockSupabase.setMockResponse('notification_settings', {
        data: dbResponse,
        error: null
      });

      const result = await NotificationSettings.findById('settings-report');
      expect(result.reportDeliveryFormat).toBe('excel');
    });
  });
});
