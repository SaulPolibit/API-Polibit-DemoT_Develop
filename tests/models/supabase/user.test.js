/**
 * Tests for User Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('$2b$10$mocksalt'),
  hash: jest.fn().mockResolvedValue('$2b$10$mockedhashpassword'),
  compare: jest.fn()
}));

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const bcrypt = require('bcrypt');
const { getSupabase } = require('../../../src/config/database');
const User = require('../../../src/models/supabase/user');
const { ROLES, ROLE_NAMES } = require('../../../src/models/supabase/user');

describe('User Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('Role constants', () => {
    test('should have correct role values', () => {
      expect(ROLES.ROOT).toBe(0);
      expect(ROLES.ADMIN).toBe(1);
      expect(ROLES.SUPPORT).toBe(2);
      expect(ROLES.INVESTOR).toBe(3);
      expect(ROLES.GUEST).toBe(4);
    });

    test('should have correct role names', () => {
      expect(ROLE_NAMES[0]).toBe('root');
      expect(ROLE_NAMES[1]).toBe('admin');
      expect(ROLE_NAMES[2]).toBe('support');
      expect(ROLE_NAMES[3]).toBe('investor');
      expect(ROLE_NAMES[4]).toBe('guest');
    });
  });

  describe('isValidRole', () => {
    test('should return true for valid roles', () => {
      expect(User.isValidRole(0)).toBe(true);
      expect(User.isValidRole(1)).toBe(true);
      expect(User.isValidRole(2)).toBe(true);
      expect(User.isValidRole(3)).toBe(true);
      expect(User.isValidRole(4)).toBe(true);
    });

    test('should return false for invalid roles', () => {
      expect(User.isValidRole(5)).toBe(false);
      expect(User.isValidRole(-1)).toBe(false);
      expect(User.isValidRole(null)).toBe(false);
      expect(User.isValidRole(undefined)).toBe(false);
      expect(User.isValidRole('admin')).toBe(false);
    });
  });

  describe('create', () => {
    test('should create user with password successfully', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 3,
        is_active: true,
        is_email_verified: false,
        app_language: 'en',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'Test@Example.COM',
        password: 'mypassword',
        firstName: 'John',
        lastName: 'Doe',
        role: ROLES.INVESTOR
      });

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.role).toBe(3);
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    test('should create OAuth user without password', async () => {
      const dbResponse = {
        id: 'user-oauth',
        email: 'oauth@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'OAuth',
        last_name: 'User',
        role: 3,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        role: ROLES.INVESTOR
        // No password provided
      });

      expect(result.id).toBe('user-oauth');
      expect(result.email).toBe('oauth@example.com');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    test('should throw error if role is missing', async () => {
      await expect(User.create({
        email: 'test@example.com',
        firstName: 'Test'
      })).rejects.toThrow('Role is required');
    });

    test('should throw error if role is invalid', async () => {
      await expect(User.create({
        email: 'test@example.com',
        firstName: 'Test',
        role: 99
      })).rejects.toThrow('Invalid role');
    });

    test('should create admin user', async () => {
      const dbResponse = {
        id: 'admin-123',
        email: 'admin@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'Admin',
        last_name: 'User',
        role: 1,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'admin@example.com',
        password: 'adminpass',
        firstName: 'Admin',
        lastName: 'User',
        role: ROLES.ADMIN
      });

      expect(result.role).toBe(1);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.create({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        role: ROLES.INVESTOR
      })).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find user by ID successfully', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 3,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    test('should return null if user not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      const result = await User.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findById('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    test('should find user by email', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findByEmail('Test@Example.COM');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    test('should return null if email not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      const result = await User.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByProsperapId', () => {
    test('should find user by Prospera ID', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'prospera@example.com',
        prospera_id: 'prospera-456',
        first_name: 'Prospera',
        last_name: 'User',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findByProsperapId('prospera-456');

      expect(result.id).toBe('user-123');
      expect(result.prosperaId).toBe('prospera-456');
    });

    test('should return null if Prospera ID not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      const result = await User.findByProsperapId('nonexistent-prospera');
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    test('should find one user by criteria', async () => {
      const dbResponse = {
        id: 'user-unique',
        email: 'unique@example.com',
        first_name: 'Unique',
        last_name: 'User',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findOne({ email: 'unique@example.com' });

      expect(result.id).toBe('user-unique');
      expect(result.email).toBe('unique@example.com');
    });

    test('should return null if no user matches criteria', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      const result = await User.findOne({ email: 'nonexistent@example.com' });
      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    test('should find users by role', async () => {
      const dbResponse = [
        {
          id: 'user-1',
          email: 'investor1@example.com',
          first_name: 'Investor',
          last_name: 'One',
          role: 3,
          is_active: true
        },
        {
          id: 'user-2',
          email: 'investor2@example.com',
          first_name: 'Investor',
          last_name: 'Two',
          role: 3,
          is_active: true
        }
      ];

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.find({ role: ROLES.INVESTOR });

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(3);
      expect(result[1].role).toBe(3);
    });

    test('should return empty array if no users match', async () => {
      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      const result = await User.find({ role: ROLES.ROOT });
      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update user successfully', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        role: 3,
        is_active: true,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findByIdAndUpdate('user-123', {
        firstName: 'Updated',
        lastName: 'Name'
      });

      expect(result.id).toBe('user-123');
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    test('should hash password when updating', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'user@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'User',
        last_name: 'Test',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      await User.findByIdAndUpdate('user-123', {
        password: 'newpassword'
      });

      expect(bcrypt.hash).toHaveBeenCalled();
    });

    test('should validate role when updating', async () => {
      await expect(User.findByIdAndUpdate('user-123', {
        role: 99
      })).rejects.toThrow('Invalid role');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findByIdAndUpdate('user-123', { firstName: 'Test' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete user successfully', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'deleted@example.com',
        first_name: 'Deleted',
        last_name: 'User',
        role: 3,
        is_active: false
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findByIdAndDelete('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('deleted@example.com');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findByIdAndDelete('user-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'user@example.com',
        password: '$2b$10$hashedpassword',
        first_name: 'User',
        last_name: 'Test',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await User.comparePassword('user-123', 'correctpassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', '$2b$10$hashedpassword');
    });

    test('should return false for incorrect password', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'user@example.com',
        password: '$2b$10$hashedpassword',
        first_name: 'User',
        last_name: 'Test',
        role: 3,
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await User.comparePassword('user-123', 'wrongpassword');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$hashedpassword');
    });

    test('should throw error if user not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.comparePassword('nonexistent-id', 'password'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Refresh tokens', () => {
    describe('addRefreshToken', () => {
      test('should add refresh token successfully', async () => {
        const dbResponse = {
          id: 'token-123',
          user_id: 'user-456',
          token: 'refresh-token-abc',
          created_at: '2024-01-15T10:00:00Z'
        };

        mockSupabase.setMockResponse('refresh_tokens', {
          data: dbResponse,
          error: null
        });

        const result = await User.addRefreshToken('user-456', 'refresh-token-abc');

        expect(result.id).toBe('token-123');
        expect(result.user_id).toBe('user-456');
        expect(result.token).toBe('refresh-token-abc');
      });

      test('should throw error if adding token fails', async () => {
        const error = new Error('Database error');
        mockSupabase.setMockResponse('refresh_tokens', {
          data: null,
          error: error
        });

        await expect(User.addRefreshToken('user-456', 'token'))
          .rejects.toThrow('Database error');
      });
    });

    describe('getRefreshTokens', () => {
      test('should get all refresh tokens for user', async () => {
        const dbResponse = [
          {
            id: 'token-1',
            user_id: 'user-123',
            token: 'token-abc',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 'token-2',
            user_id: 'user-123',
            token: 'token-def',
            created_at: '2024-01-14T10:00:00Z'
          }
        ];

        mockSupabase.setMockResponse('refresh_tokens', {
          data: dbResponse,
          error: null
        });

        const result = await User.getRefreshTokens('user-123');

        expect(result).toHaveLength(2);
        expect(result[0].token).toBe('token-abc');
        expect(result[1].token).toBe('token-def');
      });

      test('should return empty array if no tokens', async () => {
        mockSupabase.setMockResponse('refresh_tokens', {
          data: [],
          error: null
        });

        const result = await User.getRefreshTokens('user-no-tokens');
        expect(result).toEqual([]);
      });
    });

    describe('removeRefreshToken', () => {
      test('should remove refresh token successfully', async () => {
        mockSupabase.setMockResponse('refresh_tokens', {
          data: null,
          error: null
        });

        await expect(User.removeRefreshToken('token-to-remove')).resolves.not.toThrow();
      });

      test('should throw error if removal fails', async () => {
        const error = new Error('Deletion failed');
        mockSupabase.setMockResponse('refresh_tokens', {
          data: null,
          error: error
        });

        await expect(User.removeRefreshToken('token'))
          .rejects.toThrow('Deletion failed');
      });
    });
  });

  describe('searchInvestors', () => {
    test('should search investors by email', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Investor',
          role: 3,
          is_active: true
        }
      ];

      // Create custom query mock with .or() method
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: dbResponse, error: null })
      };
      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      const result = await User.searchInvestors('john');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].role).toBe(3);
    });

    test('should search investors by name', async () => {
      const dbResponse = [
        {
          id: 'investor-1',
          email: 'investor@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 3,
          is_active: true
        }
      ];

      // Create custom query mock with .or() method
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: dbResponse, error: null })
      };
      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      const result = await User.searchInvestors('Jane');

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Jane');
    });

    test('should return empty array if no matches', async () => {
      // Create custom query mock with .or() method
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null })
      };
      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      const result = await User.searchInvestors('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getDisplayName', () => {
    test('should return first and last name for non-investor', () => {
      const user = {
        role: ROLES.ADMIN,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('Admin User');
    });

    test('should return email if name not provided for non-investor', () => {
      const user = {
        role: ROLES.SUPPORT,
        firstName: '',
        lastName: '',
        email: 'support@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('support@example.com');
    });

    test('should return fullName for Individual investor', () => {
      const user = {
        role: ROLES.INVESTOR,
        investorType: 'Individual',
        fullName: 'John Individual Doe',
        email: 'individual@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('John Individual Doe');
    });

    test('should return institutionName for Institution investor', () => {
      const user = {
        role: ROLES.INVESTOR,
        investorType: 'Institution',
        institutionName: 'Big Bank Corp',
        email: 'institution@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('Big Bank Corp');
    });

    test('should return fundName for Fund of Funds investor', () => {
      const user = {
        role: ROLES.INVESTOR,
        investorType: 'Fund of Funds',
        fundName: 'Global Investment Fund',
        email: 'fund@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('Global Investment Fund');
    });

    test('should return officeName for Family Office investor', () => {
      const user = {
        role: ROLES.INVESTOR,
        investorType: 'Family Office',
        officeName: 'Smith Family Office',
        email: 'office@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('Smith Family Office');
    });

    test('should fallback to email for investor with unknown type', () => {
      const user = {
        role: ROLES.INVESTOR,
        investorType: 'Unknown',
        email: 'unknown@example.com'
      };

      const displayName = User.getDisplayName(user);
      expect(displayName).toBe('unknown@example.com');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        app_language: 'en',
        profile_image: 'https://example.com/image.jpg',
        role: 3,
        is_active: true,
        is_email_verified: true,
        last_login: '2024-01-15T10:00:00Z',
        phone_number: '+1234567890',
        investor_type: 'Individual',
        full_name: 'John Doe',
        wallet_address: '0x123abc',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('user-123');

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.appLanguage).toBe('en');
      expect(result.profileImage).toBe('https://example.com/image.jpg');
      expect(result.isActive).toBe(true);
      expect(result.isEmailVerified).toBe(true);
      expect(result.lastLogin).toBe('2024-01-15T10:00:00Z');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.investorType).toBe('Individual');
      expect(result.fullName).toBe('John Doe');
      expect(result.walletAddress).toBe('0x123abc');
    });
  });

  describe('toJSON', () => {
    test('should exclude sensitive fields from JSON', async () => {
      const dbResponse = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 3,
        password_reset_token: 'reset-token-123',
        password_reset_expires: '2024-01-16T10:00:00Z',
        email_verification_token: 'verify-token-456',
        email_verification_expires: '2024-01-16T10:00:00Z',
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const user = await User.findById('user-123');
      const json = user.toJSON();

      expect(json.id).toBe('user-123');
      expect(json.email).toBe('test@example.com');
      expect(json.firstName).toBe('John');
      expect(json.password).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.passwordResetExpires).toBeUndefined();
      expect(json.emailVerificationToken).toBeUndefined();
      expect(json.emailVerificationExpires).toBeUndefined();
      expect(json.toJSON).toBeUndefined();
    });
  });

  describe('Investor types', () => {
    test('should handle Individual investor fields', async () => {
      const dbResponse = {
        id: 'investor-individual',
        email: 'individual@example.com',
        first_name: 'John',
        last_name: 'Individual',
        role: 3,
        investor_type: 'Individual',
        full_name: 'John Individual Doe',
        date_of_birth: '1990-01-01',
        nationality: 'US',
        passport_number: 'AB123456',
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('investor-individual');

      expect(result.investorType).toBe('Individual');
      expect(result.fullName).toBe('John Individual Doe');
      expect(result.dateOfBirth).toBe('1990-01-01');
      expect(result.nationality).toBe('US');
      expect(result.passportNumber).toBe('AB123456');
    });

    test('should handle Institution investor fields', async () => {
      const dbResponse = {
        id: 'investor-institution',
        email: 'institution@example.com',
        first_name: 'Institution',
        last_name: 'Rep',
        role: 3,
        investor_type: 'Institution',
        institution_name: 'Big Bank Corp',
        institution_type: 'Bank',
        registration_number: 'REG123456',
        legal_representative: 'Jane Doe',
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('investor-institution');

      expect(result.investorType).toBe('Institution');
      expect(result.institutionName).toBe('Big Bank Corp');
      expect(result.institutionType).toBe('Bank');
      expect(result.registrationNumber).toBe('REG123456');
      expect(result.legalRepresentative).toBe('Jane Doe');
    });

    test('should handle Fund of Funds investor fields', async () => {
      const dbResponse = {
        id: 'investor-fund',
        email: 'fund@example.com',
        first_name: 'Fund',
        last_name: 'Manager',
        role: 3,
        investor_type: 'Fund of Funds',
        fund_name: 'Global Investment Fund',
        fund_manager: 'John Manager',
        aum: '1000000000',
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('investor-fund');

      expect(result.investorType).toBe('Fund of Funds');
      expect(result.fundName).toBe('Global Investment Fund');
      expect(result.fundManager).toBe('John Manager');
      expect(result.aum).toBe('1000000000');
    });

    test('should handle Family Office investor fields', async () => {
      const dbResponse = {
        id: 'investor-office',
        email: 'office@example.com',
        first_name: 'Office',
        last_name: 'Contact',
        role: 3,
        investor_type: 'Family Office',
        office_name: 'Smith Family Office',
        family_name: 'Smith',
        principal_contact: 'Robert Smith',
        assets_under_management: '500000000',
        is_active: true
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.findById('investor-office');

      expect(result.investorType).toBe('Family Office');
      expect(result.officeName).toBe('Smith Family Office');
      expect(result.familyName).toBe('Smith');
      expect(result.principalContact).toBe('Robert Smith');
      expect(result.assetsUnderManagement).toBe('500000000');
    });
  });

  describe('create with ID', () => {
    test('should create user with ID provided (for Supabase Auth integration)', async () => {
      const dbResponse = {
        id: 'auth-user-456',
        email: 'auth@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'Auth',
        last_name: 'User',
        role: 3,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        id: 'auth-user-456',
        email: 'auth@example.com',
        password: 'password123',
        firstName: 'Auth',
        lastName: 'User',
        role: ROLES.INVESTOR
      });

      expect(result.id).toBe('auth-user-456');
      expect(result.email).toBe('auth@example.com');
    });
  });

  describe('Error handling in find methods', () => {
    test('should throw error on database failure in findByEmail', async () => {
      const error = new Error('Database connection lost');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findByEmail('test@example.com')).rejects.toThrow('Database connection lost');
    });

    test('should throw error on database failure in findByProsperapId', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findByProsperapId('prospera-123')).rejects.toThrow('Database error');
    });

    test('should throw error on database failure in findOne', async () => {
      const error = new Error('Query failed');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.findOne({ email: 'test@example.com' })).rejects.toThrow('Query failed');
    });

    test('should throw error on database failure in find', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('users', {
        data: null,
        error: error
      });

      await expect(User.find({ role: ROLES.INVESTOR })).rejects.toThrow('Database error');
    });

    test('should throw error on database failure in searchInvestors', async () => {
      const error = new Error('Search failed');
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: null, error: error })
      };
      mockSupabase.from = jest.fn().mockReturnValue(searchQuery);

      await expect(User.searchInvestors('search-term')).rejects.toThrow('Search failed');
    });
  });

  describe('findWithStructures', () => {
    test('should find user with structures successfully', async () => {
      const userData = {
        id: 'investor-123',
        email: 'investor@example.com',
        first_name: 'Investor',
        last_name: 'User',
        role: 3,
        is_active: true
      };

      const investmentsData = [
        {
          structure_id: 'structure-1',
          ownership_percentage: 25,
          equity_ownership_percent: null,
          structures: {
            id: 'structure-1',
            name: 'Fund A',
            type: 'fund',
            status: 'Active'
          }
        },
        {
          structure_id: 'structure-2',
          ownership_percentage: null,
          equity_ownership_percent: 15,
          structures: {
            id: 'structure-2',
            name: 'Fund B',
            type: 'fund',
            status: 'Active'
          }
        }
      ];

      // Mock user query
      mockSupabase.setMockResponse('users', {
        data: userData,
        error: null
      });

      // Mock investments query
      const investmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: investmentsData, error: null })
      };
      mockSupabase.from = jest.fn((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: userData, error: null })
          };
        } else if (table === 'investments') {
          return investmentsQuery;
        }
      });

      const result = await User.findWithStructures('investor-123');

      // Test that the function executed successfully
      expect(result.id).toBe('investor-123');
      expect(result.firstName).toBe('Investor');
      expect(result.lastName).toBe('User');
    });

    test('should throw error if user not found', async () => {
      const error = new Error('User not found');
      error.code = 'PGRST116';

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: error })
      }));

      await expect(User.findWithStructures('nonexistent-id')).rejects.toThrow('User not found');
    });

    test('should throw error on database error', async () => {
      const userData = {
        id: 'investor-123',
        email: 'investor@example.com',
        first_name: 'Investor',
        last_name: 'User',
        role: 3,
        is_active: true
      };

      const error = new Error('Database connection error');

      mockSupabase.from = jest.fn((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: userData, error: null })
          };
        } else if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: error })
          };
        }
      });

      await expect(User.findWithStructures('investor-123')).rejects.toThrow('Error finding user structures');
    });

    test('should handle user with no investments', async () => {
      const userData = {
        id: 'investor-new',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'Investor',
        role: 3,
        is_active: true
      };

      mockSupabase.from = jest.fn((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: userData, error: null })
          };
        } else if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
      });

      const result = await User.findWithStructures('investor-new');

      expect(result.id).toBe('investor-new');
      expect(result.firstName).toBe('New');
    });
  });

  describe('getPortfolioSummary', () => {
    test('should get portfolio summary successfully', async () => {
      const portfolioData = {
        total_investment: 100000,
        current_value: 150000,
        unrealized_gain: 50000
      };

      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: portfolioData,
        error: null
      });

      const result = await User.getPortfolioSummary('investor-123');

      expect(result).toEqual(portfolioData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_investor_portfolio_summary', {
        p_user_id: 'investor-123'
      });
    });

    test('should throw error on RPC failure', async () => {
      const error = new Error('RPC error');
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: error
      });

      await expect(User.getPortfolioSummary('investor-123')).rejects.toThrow('RPC error');
    });
  });

  describe('getCommitmentsSummary', () => {
    test('should get commitments summary successfully', async () => {
      const investmentsData = [
        {
          structure_id: 'structure-1',
          ownership_percentage: 25,
          equity_ownership_percent: null,
          structures: {
            id: 'structure-1',
            name: 'Fund A',
            type: 'fund',
            status: 'Active',
            total_commitment: 100000,
            base_currency: 'USD'
          }
        }
      ];

      const allocationsData = [
        {
          allocated_amount: 25000,
          paid_amount: 15000,
          capital_call: {
            structure_id: 'structure-1'
          }
        }
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: investmentsData, error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: allocationsData, error: null })
          };
        }
      });

      const result = await User.getCommitmentsSummary('investor-123');

      expect(result.totalCommitment).toBe(0);
      expect(result.calledCapital).toBe(25000);
      expect(result.structures).toBeDefined();
    });

    test('should return zeros when no commitments exist', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
      });

      const result = await User.getCommitmentsSummary('investor-123');

      expect(result.totalCommitment).toBe(0);
      expect(result.calledCapital).toBe(0);
      expect(result.uncalledCapital).toBe(0);
      expect(result.activeFunds).toBe(0);
      expect(result.structures).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: error })
      }));

      await expect(User.getCommitmentsSummary('investor-123')).rejects.toThrow('Database error');
    });
  });

  describe('getCapitalCallsSummary', () => {
    test('should get capital calls summary successfully', async () => {
      const investmentsData = [
        {
          structure_id: 'structure-1',
          structures: {
            id: 'structure-1',
            name: 'Fund A',
            type: 'fund',
            status: 'Active'
          }
        }
      ];

      const allocationsData = [
        {
          id: 'alloc-1',
          allocated_amount: 10000,
          paid_amount: 5000,
          status: 'Pending',
          capital_call: {
            id: 'call-1',
            structure_id: 'structure-1',
            call_number: 1,
            call_date: '2024-01-15',
            due_date: '2024-02-15',
            status: 'Active',
            purpose: 'Initial funding'
          }
        },
        {
          id: 'alloc-2',
          allocated_amount: 15000,
          paid_amount: 15000,
          status: 'Paid',
          capital_call: {
            id: 'call-2',
            structure_id: 'structure-1',
            call_number: 2,
            call_date: '2024-02-15',
            due_date: '2024-03-15',
            status: 'Paid',
            purpose: 'Second funding'
          }
        }
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: investmentsData, error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: allocationsData, error: null })
          };
        }
      });

      const result = await User.getCapitalCallsSummary('investor-123');

      expect(result.summary).toBeDefined();
      expect(result.summary.totalCalled).toBe(25000);
      expect(result.summary.totalPaid).toBe(20000);
      expect(result.summary.outstanding).toBe(5000);
      expect(result.summary.totalCalls).toBe(2);
      expect(result.capitalCalls).toHaveLength(2);
      expect(result.structures).toBeDefined();
    });

    test('should handle empty capital calls', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
      });

      const result = await User.getCapitalCallsSummary('investor-123');

      expect(result.summary.totalCalled).toBe(0);
      expect(result.summary.totalPaid).toBe(0);
      expect(result.summary.outstanding).toBe(0);
      expect(result.summary.totalCalls).toBe(0);
      expect(result.capitalCalls).toEqual([]);
    });

    test('should throw error on investments query failure', async () => {
      const error = new Error('Investments query failed');
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: error })
      }));

      await expect(User.getCapitalCallsSummary('investor-123')).rejects.toThrow('Investments query failed');
    });

    test('should throw error on allocations query failure', async () => {
      const investmentsData = [
        {
          structure_id: 'structure-1',
          structures: {
            id: 'structure-1',
            name: 'Fund A',
            type: 'fund',
            status: 'Active'
          }
        }
      ];

      const error = new Error('Allocations query failed');

      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: investmentsData, error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: error })
          };
        }
      });

      await expect(User.getCapitalCallsSummary('investor-123')).rejects.toThrow('Allocations query failed');
    });

    test('should filter allocations without capital_call', async () => {
      const investmentsData = [
        {
          structure_id: 'structure-1',
          structures: {
            id: 'structure-1',
            name: 'Fund A',
            type: 'fund',
            status: 'Active'
          }
        }
      ];

      const allocationsData = [
        {
          id: 'alloc-1',
          allocated_amount: 10000,
          paid_amount: 5000,
          status: 'Pending',
          capital_call: null // No capital call associated
        },
        {
          id: 'alloc-2',
          allocated_amount: 15000,
          paid_amount: 15000,
          status: 'Paid',
          capital_call: {
            id: 'call-2',
            structure_id: 'structure-1',
            call_number: 1,
            call_date: '2024-02-15',
            due_date: '2024-03-15',
            status: 'Paid',
            purpose: 'Funding'
          }
        }
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'investments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: investmentsData, error: null })
          };
        } else if (table === 'capital_call_allocations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: allocationsData, error: null })
          };
        }
      });

      const result = await User.getCapitalCallsSummary('investor-123');

      // Should only include the allocation with a capital_call
      expect(result.capitalCalls).toHaveLength(1);
      expect(result.capitalCalls[0].id).toBe('call-2');
    });
  });

  describe('User roles', () => {
    test('should create root user', async () => {
      const dbResponse = {
        id: 'root-123',
        email: 'root@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'Root',
        last_name: 'User',
        role: 0,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'root@example.com',
        password: 'rootpass',
        firstName: 'Root',
        lastName: 'User',
        role: ROLES.ROOT
      });

      expect(result.role).toBe(0);
    });

    test('should create support user', async () => {
      const dbResponse = {
        id: 'support-123',
        email: 'support@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'Support',
        last_name: 'User',
        role: 2,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'support@example.com',
        password: 'supportpass',
        firstName: 'Support',
        lastName: 'User',
        role: ROLES.SUPPORT
      });

      expect(result.role).toBe(2);
    });

    test('should create guest user', async () => {
      const dbResponse = {
        id: 'guest-123',
        email: 'guest@example.com',
        password: '$2b$10$mockedhashpassword',
        first_name: 'Guest',
        last_name: 'User',
        role: 4,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('users', {
        data: dbResponse,
        error: null
      });

      const result = await User.create({
        email: 'guest@example.com',
        password: 'guestpass',
        firstName: 'Guest',
        lastName: 'User',
        role: ROLES.GUEST
      });

      expect(result.role).toBe(4);
    });
  });
});
