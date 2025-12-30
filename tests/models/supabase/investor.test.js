/**
 * Tests for Investor Supabase Model
 * Note: This model is deprecated but tests are maintained for backward compatibility
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Investor = require('../../../src/models/supabase/investor');

describe('Investor Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create an Individual investor successfully', async () => {
      const investorData = {
        investorType: 'Individual',
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
        country: 'USA',
        nationality: 'American',
        dateOfBirth: '1985-05-15',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        accreditedInvestor: true,
        kycStatus: 'verified',
        createdBy: 'user-123'
      };

      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Individual',
        email: 'john.doe@example.com',
        full_name: 'John Doe',
        phone_number: '+1234567890',
        country: 'USA',
        nationality: 'American',
        date_of_birth: '1985-05-15',
        address_line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        accredited_investor: true,
        kyc_status: 'verified',
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.create(investorData);

      expect(result.id).toBe('investor-123');
      expect(result.investorType).toBe('Individual');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.fullName).toBe('John Doe');
      expect(result.accreditedInvestor).toBe(true);
      expect(result.kycStatus).toBe('verified');
    });

    test('should create an Institution investor successfully', async () => {
      const investorData = {
        investorType: 'Institution',
        email: 'contact@institution.com',
        institutionName: 'ABC Capital',
        institutionType: 'Pension Fund',
        registrationNumber: 'REG-12345',
        legalRepresentative: 'Jane Smith',
        country: 'USA',
        accreditedInvestor: true,
        createdBy: 'user-456'
      };

      const dbResponse = {
        id: 'investor-456',
        investor_type: 'Institution',
        email: 'contact@institution.com',
        institution_name: 'ABC Capital',
        institution_type: 'Pension Fund',
        registration_number: 'REG-12345',
        legal_representative: 'Jane Smith',
        country: 'USA',
        accredited_investor: true,
        created_by: 'user-456'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.create(investorData);

      expect(result.investorType).toBe('Institution');
      expect(result.institutionName).toBe('ABC Capital');
      expect(result.institutionType).toBe('Pension Fund');
      expect(result.registrationNumber).toBe('REG-12345');
      expect(result.legalRepresentative).toBe('Jane Smith');
    });

    test('should create a Fund of Funds investor successfully', async () => {
      const investorData = {
        investorType: 'Fund of Funds',
        email: 'contact@fund.com',
        fundName: 'Global Fund of Funds',
        fundManager: 'Fund Manager LLC',
        aum: 1000000000,
        country: 'USA',
        accreditedInvestor: true,
        createdBy: 'user-789'
      };

      const dbResponse = {
        id: 'investor-789',
        investor_type: 'Fund of Funds',
        email: 'contact@fund.com',
        fund_name: 'Global Fund of Funds',
        fund_manager: 'Fund Manager LLC',
        aum: 1000000000,
        country: 'USA',
        accredited_investor: true,
        created_by: 'user-789'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.create(investorData);

      expect(result.investorType).toBe('Fund of Funds');
      expect(result.fundName).toBe('Global Fund of Funds');
      expect(result.fundManager).toBe('Fund Manager LLC');
      expect(result.aum).toBe(1000000000);
    });

    test('should create a Family Office investor successfully', async () => {
      const investorData = {
        investorType: 'Family Office',
        email: 'contact@familyoffice.com',
        officeName: 'Smith Family Office',
        familyName: 'Smith',
        principalContact: 'Robert Smith',
        assetsUnderManagement: 500000000,
        country: 'USA',
        accreditedInvestor: true,
        createdBy: 'user-101'
      };

      const dbResponse = {
        id: 'investor-101',
        investor_type: 'Family Office',
        email: 'contact@familyoffice.com',
        office_name: 'Smith Family Office',
        family_name: 'Smith',
        principal_contact: 'Robert Smith',
        assets_under_management: 500000000,
        country: 'USA',
        accredited_investor: true,
        created_by: 'user-101'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.create(investorData);

      expect(result.investorType).toBe('Family Office');
      expect(result.officeName).toBe('Smith Family Office');
      expect(result.familyName).toBe('Smith');
      expect(result.principalContact).toBe('Robert Smith');
      expect(result.assetsUnderManagement).toBe(500000000);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.create({})).rejects.toThrow('Error creating investor');
    });
  });

  describe('findById', () => {
    test('should find investor by ID successfully', async () => {
      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Individual',
        email: 'john.doe@example.com',
        full_name: 'John Doe',
        kyc_status: 'verified'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.id).toBe('investor-123');
      expect(result.investorType).toBe('Individual');
      expect(result.fullName).toBe('John Doe');
    });

    test('should return null if investor not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      const result = await Investor.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.findById('investor-123')).rejects.toThrow('Error finding investor');
    });
  });

  describe('findByEmail', () => {
    test('should find investor by email successfully', async () => {
      const dbResponse = {
        id: 'investor-123',
        email: 'john.doe@example.com',
        full_name: 'John Doe'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByEmail('John.Doe@Example.com');

      expect(result.id).toBe('investor-123');
      expect(result.email).toBe('john.doe@example.com');
    });

    test('should convert email to lowercase when searching', async () => {
      const dbResponse = {
        id: 'investor-123',
        email: 'test@example.com'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByEmail('Test@EXAMPLE.COM');

      // The method converts email to lowercase internally
      expect(result.email).toBe('test@example.com');
    });

    test('should return null if investor not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      const result = await Investor.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.findByEmail('test@example.com')).rejects.toThrow('Error finding investor by email');
    });
  });

  describe('find', () => {
    test('should find all investors when no filter provided', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          investor_type: 'Individual',
          full_name: 'John Doe'
        },
        {
          id: 'investor-2',
          investor_type: 'Institution',
          institution_name: 'ABC Capital'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('investor-1');
      expect(result[1].id).toBe('investor-2');
    });

    test('should filter investors by investor type', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          investor_type: 'Individual',
          full_name: 'John Doe'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.find({ investorType: 'Individual' });

      expect(result).toHaveLength(1);
      expect(result[0].investorType).toBe('Individual');
    });

    test('should filter investors by KYC status', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          kyc_status: 'verified',
          full_name: 'John Doe'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.find({ kycStatus: 'verified' });

      expect(result).toHaveLength(1);
      expect(result[0].kycStatus).toBe('verified');
    });

    test('should return empty array if no investors found', async () => {
      mockSupabase.setMockResponse('investors', {
        data: [],
        error: null
      });

      const result = await Investor.find();
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.find()).rejects.toThrow('Error finding investors');
    });
  });

  describe('findByUserId', () => {
    test('should find investors created by user', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          created_by: 'user-123',
          full_name: 'John Doe'
        },
        {
          id: 'investor-2',
          created_by: 'user-123',
          institution_name: 'ABC Capital'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].createdBy).toBe('user-123');
      expect(result[1].createdBy).toBe('user-123');
    });
  });

  describe('findByType', () => {
    test('should find investors by type without user filter', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          investor_type: 'Institution',
          institution_name: 'ABC Capital'
        },
        {
          id: 'investor-2',
          investor_type: 'Institution',
          institution_name: 'XYZ Fund'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByType('Institution');

      expect(result).toHaveLength(2);
      expect(result[0].investorType).toBe('Institution');
      expect(result[1].investorType).toBe('Institution');
    });

    test('should find investors by type with user filter', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          investor_type: 'Individual',
          created_by: 'user-123',
          full_name: 'John Doe'
        }
      ];

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByType('Individual', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].investorType).toBe('Individual');
      expect(result[0].createdBy).toBe('user-123');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update investor successfully', async () => {
      const updateData = {
        kycStatus: 'verified',
        accreditedInvestor: true
      };

      const dbResponse = {
        id: 'investor-123',
        kyc_status: 'verified',
        accredited_investor: true,
        updated_at: '2024-02-01T10:00:00Z'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByIdAndUpdate('investor-123', updateData);

      expect(result.id).toBe('investor-123');
      expect(result.kycStatus).toBe('verified');
      expect(result.accreditedInvestor).toBe(true);
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.findByIdAndUpdate('investor-123', {})).rejects.toThrow('Error updating investor');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete investor successfully', async () => {
      const dbResponse = {
        id: 'investor-123',
        full_name: 'John Doe'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findByIdAndDelete('investor-123');

      expect(result.id).toBe('investor-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.findByIdAndDelete('investor-123')).rejects.toThrow('Error deleting investor');
    });
  });

  describe('findWithStructures', () => {
    test('should find investor with structures successfully', async () => {
      // First call returns investor
      const dbResponse1 = {
        id: 'investor-123',
        full_name: 'John Doe',
        investor_type: 'Individual'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse1,
        error: null
      });

      // Second call returns investments
      const dbResponse2 = [
        {
          structure_id: 'structure-1',
          ownership_percentage: 25,
          structures: {
            id: 'structure-1',
            name: 'Structure A',
            type: 'Fund'
          }
        },
        {
          structure_id: 'structure-2',
          equity_ownership_percent: 15,
          structures: {
            id: 'structure-2',
            name: 'Structure B',
            type: 'SPV'
          }
        }
      ];

      mockSupabase.setMockResponse('investments', {
        data: dbResponse2,
        error: null
      });

      const result = await Investor.findWithStructures('investor-123');

      expect(result.id).toBe('investor-123');
      expect(result.fullName).toBe('John Doe');
    });

    test('should throw error if investor query fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investors', {
        data: null,
        error: error
      });

      await expect(Investor.findWithStructures('investor-123')).rejects.toThrow('Error finding investor');
    });

    test('should throw error if investments query fails', async () => {
      // First call succeeds (investor)
      mockSupabase.setMockResponse('investors', {
        data: { id: 'investor-123' },
        error: null
      });

      // Second call fails (investments)
      const error = new Error('Database error');
      mockSupabase.setMockResponse('investments', {
        data: null,
        error: error
      });

      await expect(Investor.findWithStructures('investor-123')).rejects.toThrow('Error finding investor structures');
    });
  });

  describe('getPortfolioSummary', () => {
    test('should get portfolio summary for investor', async () => {
      const summaryData = {
        total_investments: 5,
        total_invested: 1000000,
        total_current_value: 1250000,
        total_returns: 250000,
        average_irr: 15.5
      };

      mockSupabase.setMockRpcResponse('get_investor_portfolio_summary', {
        data: summaryData,
        error: null
      });

      const result = await Investor.getPortfolioSummary('investor-123');

      expect(result.total_investments).toBe(5);
      expect(result.total_invested).toBe(1000000);
      expect(result.total_current_value).toBe(1250000);
    });

    test('should throw error if RPC fails', async () => {
      const error = new Error('RPC error');
      mockSupabase.setMockRpcResponse('get_investor_portfolio_summary', {
        data: null,
        error: error
      });

      await expect(Investor.getPortfolioSummary('investor-123')).rejects.toThrow('Error getting investor portfolio');
    });
  });

  describe('search', () => {
    test('should search investors by term without user filter', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          full_name: 'John Doe',
          email: 'john@example.com'
        },
        {
          id: 'investor-2',
          institution_name: 'John Capital',
          email: 'contact@johncapital.com'
        }
      ];

      // Create custom query mock with .or() method
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: dbResponse,
          error: null
        })
      };

      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      const result = await Investor.search('John');

      expect(result).toHaveLength(2);
    });

    test('should search investors by term with user filter', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          full_name: 'John Doe',
          created_by: 'user-123'
        }
      ];

      // Create custom query mock with .eq() and .or() methods
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: dbResponse,
          error: null
        })
      };

      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      const result = await Investor.search('John', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].createdBy).toBe('user-123');
    });

    test('should throw error if search fails', async () => {
      const error = new Error('Database error');

      // Create custom query mock with .or() method that returns error
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: null,
          error: error
        })
      };

      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      await expect(Investor.search('test')).rejects.toThrow('Error searching investors');
    });
  });

  describe('getDisplayName', () => {
    test('should return full name for Individual investor', () => {
      const investor = {
        investorType: 'Individual',
        fullName: 'John Doe',
        email: 'john@example.com'
      };

      const displayName = Investor.getDisplayName(investor);
      expect(displayName).toBe('John Doe');
    });

    test('should return institution name for Institution investor', () => {
      const investor = {
        investorType: 'Institution',
        institutionName: 'ABC Capital',
        email: 'contact@abc.com'
      };

      const displayName = Investor.getDisplayName(investor);
      expect(displayName).toBe('ABC Capital');
    });

    test('should return fund name for Fund of Funds investor', () => {
      const investor = {
        investorType: 'Fund of Funds',
        fundName: 'Global Fund',
        email: 'contact@fund.com'
      };

      const displayName = Investor.getDisplayName(investor);
      expect(displayName).toBe('Global Fund');
    });

    test('should return office name for Family Office investor', () => {
      const investor = {
        investorType: 'Family Office',
        officeName: 'Smith Family Office',
        email: 'contact@smith.com'
      };

      const displayName = Investor.getDisplayName(investor);
      expect(displayName).toBe('Smith Family Office');
    });

    test('should return email for unknown investor type', () => {
      const investor = {
        investorType: 'Unknown',
        email: 'test@example.com'
      };

      const displayName = Investor.getDisplayName(investor);
      expect(displayName).toBe('test@example.com');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const investorData = {
        investorType: 'Individual',
        fullName: 'John Doe',
        dateOfBirth: '1985-05-15',
        phoneNumber: '+1234567890',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        postalCode: '10001',
        kycStatus: 'verified',
        accreditedInvestor: true,
        riskTolerance: 'moderate',
        investmentPreferences: { sectors: ['tech', 'healthcare'] },
        taxId: 'TAX-12345',
        passportNumber: 'P123456',
        createdBy: 'user-123'
      };

      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Individual',
        full_name: 'John Doe',
        date_of_birth: '1985-05-15',
        phone_number: '+1234567890',
        address_line1: '123 Main St',
        address_line2: 'Apt 4B',
        postal_code: '10001',
        kyc_status: 'verified',
        accredited_investor: true,
        risk_tolerance: 'moderate',
        investment_preferences: { sectors: ['tech', 'healthcare'] },
        tax_id: 'TAX-12345',
        passport_number: 'P123456',
        created_by: 'user-123'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.create(investorData);

      expect(result.investorType).toBe('Individual');
      expect(result.fullName).toBe('John Doe');
      expect(result.dateOfBirth).toBe('1985-05-15');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.addressLine1).toBe('123 Main St');
      expect(result.addressLine2).toBe('Apt 4B');
      expect(result.postalCode).toBe('10001');
      expect(result.kycStatus).toBe('verified');
      expect(result.accreditedInvestor).toBe(true);
      expect(result.riskTolerance).toBe('moderate');
      expect(result.taxId).toBe('TAX-12345');
      expect(result.passportNumber).toBe('P123456');
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Institution',
        institution_name: 'ABC Capital',
        institution_type: 'Pension Fund',
        registration_number: 'REG-123',
        legal_representative: 'Jane Smith',
        phone_number: '+1234567890',
        kyc_status: 'verified',
        accredited_investor: true,
        risk_tolerance: 'high',
        investment_preferences: { min_investment: 100000 },
        tax_id: 'TAX-456',
        created_by: 'user-456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.investorType).toBe('Institution');
      expect(result.institutionName).toBe('ABC Capital');
      expect(result.institutionType).toBe('Pension Fund');
      expect(result.registrationNumber).toBe('REG-123');
      expect(result.legalRepresentative).toBe('Jane Smith');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.kycStatus).toBe('verified');
      expect(result.accreditedInvestor).toBe(true);
      expect(result.riskTolerance).toBe('high');
      expect(result.investmentPreferences).toEqual({ min_investment: 100000 });
      expect(result.taxId).toBe('TAX-456');
      expect(result.createdBy).toBe('user-456');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-20T10:00:00Z');
    });

    test('should handle null values in transformation', async () => {
      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Individual',
        full_name: 'John Doe',
        address_line2: null,
        tax_id: null,
        passport_number: null,
        investment_preferences: null
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.addressLine2).toBeNull();
      expect(result.taxId).toBeNull();
      expect(result.passportNumber).toBeNull();
      expect(result.investmentPreferences).toBeNull();
    });
  });

  describe('Investor types', () => {
    test('should handle Individual investor type', async () => {
      const dbResponse = {
        id: 'investor-123',
        investor_type: 'Individual',
        full_name: 'John Doe',
        date_of_birth: '1985-05-15',
        nationality: 'American'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.investorType).toBe('Individual');
      expect(result.fullName).toBe('John Doe');
      expect(result.dateOfBirth).toBe('1985-05-15');
      expect(result.nationality).toBe('American');
    });

    test('should handle Institution investor type', async () => {
      const dbResponse = {
        id: 'investor-456',
        investor_type: 'Institution',
        institution_name: 'ABC Capital',
        institution_type: 'Pension Fund',
        registration_number: 'REG-123'
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-456');

      expect(result.investorType).toBe('Institution');
      expect(result.institutionName).toBe('ABC Capital');
      expect(result.institutionType).toBe('Pension Fund');
      expect(result.registrationNumber).toBe('REG-123');
    });

    test('should handle Fund of Funds investor type', async () => {
      const dbResponse = {
        id: 'investor-789',
        investor_type: 'Fund of Funds',
        fund_name: 'Global Fund',
        fund_manager: 'Manager LLC',
        aum: 1000000000
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-789');

      expect(result.investorType).toBe('Fund of Funds');
      expect(result.fundName).toBe('Global Fund');
      expect(result.fundManager).toBe('Manager LLC');
      expect(result.aum).toBe(1000000000);
    });

    test('should handle Family Office investor type', async () => {
      const dbResponse = {
        id: 'investor-101',
        investor_type: 'Family Office',
        office_name: 'Smith Family Office',
        family_name: 'Smith',
        principal_contact: 'Robert Smith',
        assets_under_management: 500000000
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-101');

      expect(result.investorType).toBe('Family Office');
      expect(result.officeName).toBe('Smith Family Office');
      expect(result.familyName).toBe('Smith');
      expect(result.principalContact).toBe('Robert Smith');
      expect(result.assetsUnderManagement).toBe(500000000);
    });
  });

  describe('KYC statuses', () => {
    test('should handle pending KYC status', async () => {
      const dbResponse = {
        id: 'investor-123',
        kyc_status: 'pending',
        accredited_investor: false
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.kycStatus).toBe('pending');
      expect(result.accreditedInvestor).toBe(false);
    });

    test('should handle verified KYC status', async () => {
      const dbResponse = {
        id: 'investor-123',
        kyc_status: 'verified',
        accredited_investor: true
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.kycStatus).toBe('verified');
      expect(result.accreditedInvestor).toBe(true);
    });

    test('should handle rejected KYC status', async () => {
      const dbResponse = {
        id: 'investor-123',
        kyc_status: 'rejected',
        accredited_investor: false
      };

      mockSupabase.setMockResponse('investors', {
        data: dbResponse,
        error: null
      });

      const result = await Investor.findById('investor-123');

      expect(result.kycStatus).toBe('rejected');
      expect(result.accreditedInvestor).toBe(false);
    });
  });
});
