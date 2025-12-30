/**
 * Company Model Tests
 * Tests for src/models/supabase/company.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Company = require('../../src/models/supabase/company');

describe('Company Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new company successfully', async () => {
      const companyData = {
        userId: 'user-123',
        firmName: 'Acme Corporation',
        firmEmail: 'contact@acme.com',
        firmPhone: '+1234567890',
        websiteURL: 'https://acme.com',
        address: '123 Main St, City',
        description: 'Leading technology company',
      };

      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Acme Corporation',
          firm_email: 'contact@acme.com',
          firm_phone: '+1234567890',
          website_url: 'https://acme.com',
          address: '123 Main St, City',
          description: 'Leading technology company',
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.create(companyData);

      expect(company).toBeDefined();
      expect(company.id).toBe('company-123');
      expect(company.userId).toBe('user-123');
      expect(company.firmName).toBe('Acme Corporation');
      expect(company.firmEmail).toBe('contact@acme.com');
      expect(company.firmPhone).toBe('+1234567890');
      expect(company.websiteURL).toBe('https://acme.com');
      expect(company.address).toBe('123 Main St, City');
      expect(company.description).toBe('Leading technology company');
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
    });

    test('should create company with minimal required fields', async () => {
      const companyData = {
        userId: 'user-123',
        firmName: 'Tech Startup',
      };

      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-456',
          user_id: 'user-123',
          firm_name: 'Tech Startup',
          firm_email: null,
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.create(companyData);

      expect(company).toBeDefined();
      expect(company.id).toBe('company-456');
      expect(company.firmName).toBe('Tech Startup');
    });

    test('should throw error if creation fails', async () => {
      const companyData = {
        userId: 'user-123',
        firmName: 'Test Company',
      };

      mockSupabase.setMockResponse('companies', {
        data: null,
        error: new Error('Database error'),
      });

      await expect(Company.create(companyData)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find company by ID successfully', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Acme Corporation',
          firm_email: 'contact@acme.com',
          firm_phone: '+1234567890',
          website_url: 'https://acme.com',
          address: '123 Main St',
          description: 'Tech company',
          firm_logo: 'https://example.com/logo.png',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findById('company-123');

      expect(company).toBeDefined();
      expect(company.id).toBe('company-123');
      expect(company.userId).toBe('user-123');
      expect(company.firmName).toBe('Acme Corporation');
      expect(company.firmLogo).toBe('https://example.com/logo.png');
    });

    test('should return null if company not found', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const company = await Company.findById('nonexistent-id');

      expect(company).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: new Error('Connection error'),
      });

      await expect(Company.findById('company-123')).rejects.toThrow('Connection error');
    });
  });

  describe('findByUserId', () => {
    test('should find company by user ID', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'User Company',
          firm_email: 'user@company.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findByUserId('user-123');

      expect(company).toBeDefined();
      expect(company.userId).toBe('user-123');
      expect(company.firmName).toBe('User Company');
    });

    test('should return null if no company found for user', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const company = await Company.findByUserId('user-without-company');

      expect(company).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('should find company by email', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Email Company',
          firm_email: 'contact@emailcompany.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findByEmail('contact@emailcompany.com');

      expect(company).toBeDefined();
      expect(company.firmEmail).toBe('contact@emailcompany.com');
      expect(company.firmName).toBe('Email Company');
    });

    test('should return null if email not found', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const company = await Company.findByEmail('nonexistent@example.com');

      expect(company).toBeNull();
    });
  });

  describe('findOne', () => {
    test('should find one company by single criteria', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Single Criteria Company',
          firm_email: 'contact@single.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findOne({ firmName: 'Single Criteria Company' });

      expect(company).toBeDefined();
      expect(company.firmName).toBe('Single Criteria Company');
    });

    test('should find one company by multiple criteria', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Multi Criteria Company',
          firm_email: 'multi@company.com',
          firm_phone: '+1111111111',
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findOne({
        userId: 'user-123',
        firmEmail: 'multi@company.com',
      });

      expect(company).toBeDefined();
      expect(company.userId).toBe('user-123');
      expect(company.firmEmail).toBe('multi@company.com');
    });

    test('should return null if no match found', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const company = await Company.findOne({ firmName: 'Non-existent' });

      expect(company).toBeNull();
    });
  });

  describe('find', () => {
    test('should find all companies when no criteria provided', async () => {
      mockSupabase.setMockResponse('companies', {
        data: [
          {
            id: 'company-1',
            user_id: 'user-1',
            firm_name: 'Company One',
            firm_email: 'one@company.com',
            firm_phone: null,
            website_url: null,
            address: null,
            description: null,
            firm_logo: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'company-2',
            user_id: 'user-2',
            firm_name: 'Company Two',
            firm_email: 'two@company.com',
            firm_phone: null,
            website_url: null,
            address: null,
            description: null,
            firm_logo: null,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        error: null,
      });

      const companies = await Company.find();

      expect(companies).toHaveLength(2);
      expect(companies[0].firmName).toBe('Company One');
      expect(companies[1].firmName).toBe('Company Two');
    });

    test('should find companies by criteria', async () => {
      mockSupabase.setMockResponse('companies', {
        data: [
          {
            id: 'company-1',
            user_id: 'user-123',
            firm_name: 'Filtered Company',
            firm_email: 'filtered@company.com',
            firm_phone: null,
            website_url: null,
            address: null,
            description: null,
            firm_logo: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const companies = await Company.find({ userId: 'user-123' });

      expect(companies).toHaveLength(1);
      expect(companies[0].userId).toBe('user-123');
    });

    test('should return empty array if no companies found', async () => {
      mockSupabase.setMockResponse('companies', {
        data: [],
        error: null,
      });

      const companies = await Company.find({ userId: 'nonexistent' });

      expect(companies).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: new Error('Query error'),
      });

      await expect(Company.find()).rejects.toThrow('Query error');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update company successfully', async () => {
      const updateData = {
        firmName: 'Updated Company Name',
        description: 'Updated description',
        firmPhone: '+9999999999',
      };

      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Updated Company Name',
          firm_email: 'contact@company.com',
          firm_phone: '+9999999999',
          website_url: 'https://company.com',
          address: '123 Main St',
          description: 'Updated description',
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Company.findByIdAndUpdate('company-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.firmName).toBe('Updated Company Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.firmPhone).toBe('+9999999999');
    });

    test('should update only provided fields', async () => {
      const updateData = {
        firmLogo: 'https://example.com/new-logo.png',
      };

      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Original Name',
          firm_email: 'original@company.com',
          firm_phone: '+1234567890',
          website_url: 'https://company.com',
          address: '123 Main St',
          description: 'Original description',
          firm_logo: 'https://example.com/new-logo.png',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Company.findByIdAndUpdate('company-123', updateData);

      expect(updated.firmLogo).toBe('https://example.com/new-logo.png');
      expect(updated.firmName).toBe('Original Name');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: new Error('Update failed'),
      });

      await expect(
        Company.findByIdAndUpdate('company-123', { firmName: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('findOneAndUpdate', () => {
    test('should update existing company', async () => {
      const filter = { userId: 'user-123' };
      const updateData = { firmName: 'Updated via findOneAndUpdate' };

      // Mock returns the updated data after the update operation
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Updated via findOneAndUpdate',
          firm_email: 'contact@company.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Company.findOneAndUpdate(filter, updateData);

      expect(updated).toBeDefined();
      expect(updated.firmName).toBe('Updated via findOneAndUpdate');
    });

    test('should upsert company when upsert option is true', async () => {
      const filter = { userId: 'user-new' };
      const updateData = {
        firmName: 'Upserted Company',
        firmEmail: 'upsert@company.com',
      };

      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-new',
          user_id: 'user-new',
          firm_name: 'Upserted Company',
          firm_email: 'upsert@company.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const company = await Company.findOneAndUpdate(filter, updateData, { upsert: true });

      expect(company).toBeDefined();
      expect(company.userId).toBe('user-new');
      expect(company.firmName).toBe('Upserted Company');
    });

    test('should return null if company not found and upsert is false', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await Company.findOneAndUpdate(
        { userId: 'nonexistent' },
        { firmName: 'Test' }
      );

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete company successfully', async () => {
      mockSupabase.setMockResponse('companies', {
        data: {
          id: 'company-123',
          user_id: 'user-123',
          firm_name: 'Deleted Company',
          firm_email: 'deleted@company.com',
          firm_phone: null,
          website_url: null,
          address: null,
          description: null,
          firm_logo: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await Company.findByIdAndDelete('company-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('company-123');
      expect(deleted.firmName).toBe('Deleted Company');
    });

    test('should throw error if deletion fails', async () => {
      mockSupabase.setMockResponse('companies', {
        data: null,
        error: new Error('Deletion failed'),
      });

      await expect(Company.findByIdAndDelete('company-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        userId: 'user-123',
        firmName: 'Test Company',
        firmLogo: 'logo.png',
        firmEmail: 'test@company.com',
        firmPhone: '+1234567890',
        websiteURL: 'https://test.com',
      };

      const dbData = Company._toDbFields(modelData);

      expect(dbData.user_id).toBe('user-123');
      expect(dbData.firm_name).toBe('Test Company');
      expect(dbData.firm_logo).toBe('logo.png');
      expect(dbData.firm_email).toBe('test@company.com');
      expect(dbData.firm_phone).toBe('+1234567890');
      expect(dbData.website_url).toBe('https://test.com');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'company-123',
        user_id: 'user-123',
        firm_name: 'Test Company',
        firm_logo: 'logo.png',
        firm_email: 'test@company.com',
        firm_phone: '+1234567890',
        website_url: 'https://test.com',
        address: '123 Main St',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const modelData = Company._toModel(dbData);

      expect(modelData.id).toBe('company-123');
      expect(modelData.userId).toBe('user-123');
      expect(modelData.firmName).toBe('Test Company');
      expect(modelData.firmLogo).toBe('logo.png');
      expect(modelData.firmEmail).toBe('test@company.com');
      expect(modelData.firmPhone).toBe('+1234567890');
      expect(modelData.websiteURL).toBe('https://test.com');
      expect(modelData.address).toBe('123 Main St');
      expect(modelData.description).toBe('Test description');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = Company._toModel(null);
      expect(modelData).toBeNull();
    });
  });
});
