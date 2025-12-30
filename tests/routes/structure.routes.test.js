/**
 * Structure Routes Tests
 * Tests for src/routes/structure.routes.js
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
}));

jest.mock('../../src/middleware/rbac', () => ({
  requireInvestmentManagerAccess: (req, res, next) => next(),
  getUserContext: (req) => ({
    userId: req.auth?.userId || 'user-admin',
    userRole: req.auth?.userRole !== undefined ? req.auth.userRole : 0,
  }),
  canAccessStructure: jest.fn(() => true),
  canEditStructure: jest.fn(() => true),
  getUserStructureIds: jest.fn(() => []),
  ROLES: {
    ROOT: 0,
    ADMIN: 1,
    STAFF: 2,
    INVESTOR: 3,
    GUEST: 4,
  },
}));

jest.mock('../../src/middleware/upload', () => ({
  handleStructureBannerUpload: (req, res, next) => next(),
}));

jest.mock('../../src/utils/fileUpload', () => ({
  uploadToSupabase: jest.fn(),
  deleteFromSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const { uploadToSupabase } = require('../../src/utils/fileUpload');
const Structure = require('../../src/models/supabase/structure');
const SmartContract = require('../../src/models/supabase/smartContract');

describe('Structure Routes', () => {
  let app;
  let mockSupabase;

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
    const structureRoutes = require('../../src/routes/structure.routes');
    app.use('/api/structures', structureRoutes);
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('POST /api/structures', () => {
    test('should create a new structure successfully', async () => {
      const structureData = {
        name: 'Test Fund',
        type: 'Fund',
        description: 'Test fund description',
        totalCommitment: 1000000,
        managementFee: 2.0,
      };

      // Mock Structure.create
      jest.spyOn(Structure, 'create').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        type: 'Fund',
        description: 'Test fund description',
        totalCommitment: 1000000,
        managementFee: 2.0,
        createdBy: 'user-admin',
        createdAt: new Date().toISOString(),
      });

      // Mock SmartContract.findOne (returns null - no contract yet)
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/structures')
        .send(structureData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Fund');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/structures')
        .send({ description: 'Missing name and type' });

      expect(response.status).toBe(400);
    });

    test('should create structure with parent structure', async () => {
      const validUUID = '12345678-1234-1234-1234-123456789abc';
      const structureData = {
        name: 'Child Structure',
        type: 'SA/LLC',
        parentStructureId: validUUID,
      };

      // Mock Structure.findById for parent lookup
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: validUUID,
        name: 'Parent Fund',
        createdBy: 'user-admin',
        hierarchyLevel: 1,
      });

      // Mock Structure.create for child creation
      jest.spyOn(Structure, 'create').mockResolvedValue({
        id: 'child-123',
        name: 'Child Structure',
        type: 'SA/LLC',
        parentStructureId: validUUID,
        hierarchyLevel: 2,
        createdBy: 'user-admin',
      });

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/structures')
        .send(structureData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/structures', () => {
    test('should get all structures', async () => {
      // Mock Structure.find
      jest.spyOn(Structure, 'find').mockResolvedValue([
        {
          id: 'structure-1',
          name: 'Fund 1',
          type: 'Fund',
          createdBy: 'user-admin',
        },
        {
          id: 'structure-2',
          name: 'Fund 2',
          type: 'Fund',
          createdBy: 'user-admin',
        },
      ]);

      // Mock SmartContract.findOne for each structure
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app).get('/api/structures');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should filter structures by type', async () => {
      // Mock Structure.find with filters
      jest.spyOn(Structure, 'find').mockResolvedValue([
        {
          id: 'structure-1',
          name: 'Fund 1',
          type: 'Fund',
        },
      ]);

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app).get('/api/structures?type=Fund');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/structures/root', () => {
    test('should get all root structures', async () => {
      // Mock Structure.find (used for ROOT role)
      jest.spyOn(Structure, 'find').mockResolvedValue([
        {
          id: 'root-1',
          name: 'Root Fund',
          parentStructureId: null,
        },
      ]);

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app).get('/api/structures/root');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/structures/:id', () => {
    test('should get structure by ID successfully', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        type: 'Fund',
        createdBy: 'user-admin',
      });

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app).get('/api/structures/structure-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('structure-123');
    });

    test('should return 400 if structure not found', async () => {
      // Mock Structure.findById returns null
      jest.spyOn(Structure, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/structures/nonexistent');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/structures/:id/children', () => {
    test('should get child structures', async () => {
      // Mock Structure.findById for parent
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'parent-123',
        name: 'Parent Fund',
        createdBy: 'user-admin',
      });

      // Mock Structure.findChildStructures
      jest.spyOn(Structure, 'findChildStructures').mockResolvedValue([]);

      const response = await request(app).get('/api/structures/parent-123/children');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/structures/:id', () => {
    test.skip('should update structure successfully', async () => {
      // TODO: This test needs proper StructureAdmin mocking
      const updateData = {
        name: 'Updated Fund Name',
        description: 'Updated description',
      };

      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        type: 'Fund',
        createdBy: 'user-admin',
      });

      // Mock Structure.findByIdAndUpdate
      jest.spyOn(Structure, 'findByIdAndUpdate').mockResolvedValue({
        id: 'structure-123',
        name: 'Updated Fund Name',
        type: 'Fund',
        description: 'Updated description',
        createdBy: 'user-admin',
      });

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .put('/api/structures/structure-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/structures/:id/financials', () => {
    test('should update structure financials', async () => {
      const financials = {
        totalCalled: 600000,
        totalDistributed: 150000,
      };

      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
        totalCalled: 500000,
        totalDistributed: 100000,
      });

      // Mock Structure.findByIdAndUpdate
      jest.spyOn(Structure, 'findByIdAndUpdate').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
        totalCalled: 600000,
        totalDistributed: 150000,
      });

      // Mock SmartContract.findOne
      jest.spyOn(SmartContract, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/structures/structure-123/financials')
        .send(financials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 400 if no financial data provided', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      const response = await request(app)
        .patch('/api/structures/structure-123/financials')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/structures/:id/admins', () => {
    test.skip('should add admin to structure successfully', async () => {
      // TODO: This test needs proper StructureAdmin table mocking
      const adminData = {
        userId: 'admin-user',
        role: 1,
        canEdit: true,
      };

      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock User lookup via Supabase (for users table)
      mockSupabase.setMockResponse('users', {
        data: {
          id: 'admin-user',
          email: 'admin@example.com',
          role: 1,
        },
        error: null,
      });

      // Mock structure_admins hasAccess check (doesn't exist yet)
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await request(app)
        .post('/api/structures/structure-123/admins')
        .send(adminData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/structures/:id/admins', () => {
    test('should get all admins for a structure', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock structure_admins query via Supabase
      mockSupabase.setMockResponse('structure_admins', {
        data: [
          {
            structure_id: 'structure-123',
            user_id: 'admin-1',
            role: 1,
          },
        ],
        error: null,
      });

      const response = await request(app).get('/api/structures/structure-123/admins');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/structures/:id/admins/:targetUserId', () => {
    test('should remove admin from structure', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock hasAccess check via Supabase (structure_admins table)
      mockSupabase.setMockResponse('structure_admins', {
        data: {
          structure_id: 'structure-123',
          user_id: 'admin-user',
        },
        error: null,
      });

      const response = await request(app)
        .delete('/api/structures/structure-123/admins/admin-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/structures/:id', () => {
    test('should delete structure successfully', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock Structure.delete
      jest.spyOn(Structure, 'findByIdAndDelete').mockResolvedValue(true);

      const response = await request(app).delete('/api/structures/structure-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
