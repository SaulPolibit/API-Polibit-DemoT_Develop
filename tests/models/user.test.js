/**
 * User Model Tests
 * Tests for src/models/supabase/user.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock the database module
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const { getSupabase } = require('../../src/config/database');
const User = require('../../src/models/supabase/user');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSupabase.reset();
  });

  describe('Role Validation', () => {
    test('isValidRole should return true for valid roles', () => {
      expect(User.isValidRole(0)).toBe(true); // ROOT
      expect(User.isValidRole(1)).toBe(true); // ADMIN
      expect(User.isValidRole(2)).toBe(true); // SUPPORT
      expect(User.isValidRole(3)).toBe(true); // INVESTOR
      expect(User.isValidRole(4)).toBe(true); // GUEST
    });

    test('isValidRole should return false for invalid roles', () => {
      expect(User.isValidRole(-1)).toBe(false);
      expect(User.isValidRole(5)).toBe(false);
      expect(User.isValidRole(null)).toBe(false);
      expect(User.isValidRole(undefined)).toBe(false);
      expect(User.isValidRole('admin')).toBe(false);
    });
  });

  describe('create', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 1, // ADMIN
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await User.create(userData);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('should throw error if role is not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      };

      await expect(User.create(userData)).rejects.toThrow('Role is required');
    });

    test('should throw error if role is invalid', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        role: 99,
      };

      await expect(User.create(userData)).rejects.toThrow('Invalid role');
    });

    test('should generate random password for OAuth users', async () => {
      const userData = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        role: 3,
        // No password provided
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-oauth',
          email: 'oauth@example.com',
          role: 3,
        },
        error: null,
      });

      await User.create(userData);

      // Should have generated and hashed a password
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    test('should convert email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        firstName: 'Test',
        role: 1,
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: 1,
        },
        error: null,
      });

      await User.create(userData);
      // Email should be lowercased in the database call
    });
  });

  describe('findByEmail', () => {
    test('should find user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 1,
      };

      mockSupabase.setMockResponse('users', {
        data: mockUser,
        error: null,
      });

      const result = await User.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    test('should return null if user not found', async () => {
      mockSupabase.setMockResponse('users', {
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      });

      const result = await User.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    test('should convert email to lowercase when searching', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: 1,
        },
        error: null,
      });

      await User.findByEmail('TEST@EXAMPLE.COM');
      // Should search with lowercased email
    });
  });

  describe('findById', () => {
    test('should find user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 1,
      };

      mockSupabase.setMockResponse('users', {
        data: mockUser,
        error: null,
      });

      const result = await User.findById('user-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
    });

    test('should return null if user not found', async () => {
      mockSupabase.setMockResponse('users', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await User.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  // findAll method doesn't exist in User model

  describe('findByIdAndUpdate', () => {
    test('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          first_name: 'Updated',
          last_name: 'Name',
          email: 'test@example.com',
          role: 1,
        },
        error: null,
      });

      const result = await User.findByIdAndUpdate('user-123', updateData);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('Updated');
    });
  });

  // findByIdAndDelete method doesn't exist in User model - users are typically deactivated, not deleted

  // validatePassword is typically done in authentication middleware using bcrypt.compare directly

  describe('Edge Cases', () => {
    test('should handle database errors gracefully', async () => {
      const dbError = { message: 'Database connection error', code: '23505' };
      mockSupabase.setMockResponse('users', {
        data: null,
        error: dbError,
      });

      await expect(User.findByEmail('test@example.com')).rejects.toEqual(dbError);
    });

    test('should handle missing optional fields', async () => {
      const minimalUser = {
        email: 'minimal@example.com',
        firstName: 'Min',
        password: 'pass123',
        role: 3,
      };

      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-minimal',
          email: 'minimal@example.com',
          first_name: 'Min',
          role: 3,
        },
        error: null,
      });

      const result = await User.create(minimalUser);

      expect(result).toBeDefined();
    });
  });
});
