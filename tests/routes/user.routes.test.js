/**
 * User Routes Tests
 * Tests for src/routes/user.routes.js
 */

const express = require('express');
const request = require('supertest');
const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  createToken: jest.fn((payload) => 'mock-jwt-token-' + payload.id),
}));

jest.mock('../../src/middleware/rbac', () => ({
  requireRootAccess: (req, res, next) => next(),
  getUserContext: (req) => ({
    userId: req.auth?.userId || req.user?.id || 'user-123',
    userRole: req.auth?.userRole !== undefined ? req.auth.userRole : 1,
  }),
  ROLES: {
    ROOT: 0,
    ADMIN: 1,
    STAFF: 2,
    SUPPORT: 2,
    INVESTOR: 3,
    GUEST: 4,
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        listUsers: jest.fn(),
      },
      signInWithPassword: jest.fn(),
    },
  })),
}));

jest.mock('../../src/utils/fileUpload', () => ({
  uploadToSupabase: jest.fn(),
  deleteFromSupabase: jest.fn(),
}));

jest.mock('../../src/middleware/upload', () => ({
  uploadProfileImage: {
    single: (fieldName) => (req, res, next) => {
      // Simulate file upload by adding file to request
      if (req.method === 'POST' && req.path.includes('profile-image')) {
        req.file = {
          buffer: Buffer.from('mock file content'),
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024
        };
      }
      next();
    },
  },
  uploadDocument: {
    single: (fieldName) => (req, res, next) => {
      if (req.method === 'POST') {
        req.file = {
          buffer: Buffer.from('mock document content'),
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 2048
        };
      }
      next();
    },
  },
}));

const { getSupabase } = require('../../src/config/database');
const { createToken } = require('../../src/middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const { uploadToSupabase, deleteFromSupabase } = require('../../src/utils/fileUpload');
const User = require('../../src/models/supabase/user');
const Payment = require('../../src/models/supabase/payment');

describe('User Routes', () => {
  let app;
  let mockSupabase;
  let mockAdminClient;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Add mock auth middleware
    app.use((req, res, next) => {
      req.auth = { userId: 'user-admin', userRole: 0 }; // Root user by default
      req.user = { id: 'user-admin', role: 0 };
      next();
    });

    // Mount routes
    const userRoutes = require('../../src/routes/user.routes');
    app.use('/api/users', userRoutes);
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);

    mockAdminClient = {
      auth: {
        admin: {
          createUser: jest.fn(),
          updateUserById: jest.fn(),
          listUsers: jest.fn(),
        },
      },
    };
    createClient.mockReturnValue(mockAdminClient);

    // Reset createToken mock
    createToken.mockReturnValue('mock-jwt-token-12345');

    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 3, // INVESTOR
      };

      // Mock User.findByEmail to return null (user doesn't exist)
      jest.spyOn(User, 'findByEmail').mockResolvedValue(null);

      // Mock User.create to return new user
      jest.spyOn(User, 'create').mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 3,
        isActive: true,
        appLanguage: 'en',
        profileImage: null,
        kycId: null,
        kycStatus: null,
        kycUrl: null,
        address: null,
        country: null,
      });

      // Mock Supabase Auth createUser
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
          },
        },
        error: null,
      });

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.token).toBeDefined();
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 409 if user already exists', async () => {
      // Mock User.findByEmail to return existing user
      jest.spyOn(User, 'findByEmail').mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        firstName: 'Existing',
        role: 3,
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Existing',
          role: 3,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    test('should get user profile successfully', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 0,
          is_active: true,
        },
        error: null,
      });

      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('admin@example.com');
    });

    test('should return 404 if user not found', async () => {
      mockSupabase.setMockResponse('users', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    test('should update user profile successfully', async () => {
      // Mock findById
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 0,
        },
        error: null,
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users', () => {
    test('should get all users', async () => {
      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            first_name: 'User',
            last_name: 'One',
            role: 1,
            is_active: true,
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            first_name: 'User',
            last_name: 'Two',
            role: 3,
            is_active: true,
          },
        ],
        error: null,
      });

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by ID successfully', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'user@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 3,
        },
        error: null,
      });

      const response = await request(app).get('/api/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-123');
    });

    test('should return 404 if user not found', async () => {
      mockSupabase.setMockResponse('users', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await request(app).get('/api/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    test('should enable/disable user account', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'user@example.com',
          role: 3,
          is_active: true,
        },
        error: null,
      });

      const response = await request(app)
        .patch('/api/users/user-123/status')
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should prevent deactivating ROOT users', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'root-user',
          email: 'root@example.com',
          role: 0,
          is_active: true,
        },
        error: null,
      });

      const response = await request(app)
        .patch('/api/users/root-user/status')
        .send({ isActive: false });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-123',
          email: 'user@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
        error: null,
      });

      const response = await request(app).delete('/api/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/filter', () => {
    test('should filter users by role', async () => {
      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-1', email: 'admin@example.com', first_name: 'Admin', role: 1 },
          { id: 'user-2', email: 'investor@example.com', first_name: 'Investor', role: 3 },
        ],
        error: null,
      });

      const response = await request(app).get('/api/users/filter?role=1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/investors', () => {
    test('should get all investors with payment data', async () => {
      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'investor-1',
            email: 'investor1@example.com',
            first_name: 'Investor',
            last_name: 'One',
            role: 3,
          },
        ],
        error: null,
      });

      // Mock payments
      mockSupabase.setMockResponse('payments', {
        data: [],
        error: null,
      });

      const response = await request(app).get('/api/users/investors');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/users/profile-image', () => {
    test('should upload profile image successfully', async () => {
      // Mock User.findById
      jest.spyOn(User, 'findById').mockResolvedValue({
        id: 'user-admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        profileImage: 'https://example.com/old-image.jpg',
      });

      // Mock User.findByIdAndUpdate
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
        id: 'user-admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        profileImage: 'https://example.com/new-image.jpg',
      });

      // Mock file upload utility
      uploadToSupabase.mockResolvedValue({
        publicUrl: 'https://example.com/new-image.jpg',
        fileName: 'profile-123.jpg',
        size: 1024,
      });

      const response = await request(app)
        .post('/api/users/profile-image');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/profile-image', () => {
    test('should delete profile image successfully', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-admin',
          email: 'admin@example.com',
          profile_image: 'https://supabase.co/storage/v1/documents/profile.jpg',
        },
        error: null,
      });

      deleteFromSupabase.mockResolvedValue(true);

      const response = await request(app).delete('/api/users/profile-image');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 404 if no profile image exists', async () => {
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'user-admin',
          email: 'admin@example.com',
          profile_image: null,
        },
        error: null,
      });

      const response = await request(app).delete('/api/users/profile-image');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
