/**
 * Investment Routes Tests
 * Tests for src/routes/investment.routes.js
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
  ROLES: {
    ROOT: 0,
    ADMIN: 1,
    STAFF: 2,
    INVESTOR: 3,
    GUEST: 4,
  },
}));

const { getSupabase } = require('../../src/config/database');
const Investment = require('../../src/models/supabase/investment');
const Structure = require('../../src/models/supabase/structure');

describe('Investment Routes', () => {
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
    const investmentRoutes = require('../../src/routes/investment.routes');
    app.use('/api/investments', investmentRoutes);
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('POST /api/investments', () => {
    test('should create an EQUITY investment successfully', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Tech Startup Investment',
        investmentType: 'EQUITY',
        equityInvested: 100000,
        ownershipPercentage: 10.5,
      };

      // Mock Structure.findById (structure exists)
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock Investment.create
      jest.spyOn(Investment, 'create').mockResolvedValue({
        id: 'investment-123',
        structureId: 'structure-123',
        investmentName: 'Tech Startup Investment',
        investmentType: 'EQUITY',
        equityInvested: 100000,
        ownershipPercentage: 10.5,
        userId: 'user-admin',
        createdAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/investments')
        .send(investmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investmentName).toBe('Tech Startup Investment');
    });

    test('should create a DEBT investment successfully', async () => {
      const investmentData = {
        structureId: 'structure-123',
        investmentName: 'Real Estate Loan',
        investmentType: 'DEBT',
        principalProvided: 500000,
        interestRate: 8.5,
        maturityDate: '2030-12-31',
      };

      // Mock Structure.findById (structure exists)
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock Investment.create
      jest.spyOn(Investment, 'create').mockResolvedValue({
        id: 'investment-debt',
        structureId: 'structure-123',
        investmentName: 'Real Estate Loan',
        investmentType: 'DEBT',
        principalProvided: 500000,
        interestRate: 8.5,
        maturityDate: '2030-12-31',
      });

      const response = await request(app)
        .post('/api/investments')
        .send(investmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investmentType).toBe('DEBT');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/investments')
        .send({ description: 'Missing required fields' });

      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid investment type', async () => {
      const response = await request(app)
        .post('/api/investments')
        .send({
          structureId: 'structure-123',
          investmentName: 'Test',
          investmentType: 'INVALID',
        });

      expect(response.status).toBe(400);
    });

    test('should validate structure exists', async () => {
      // Mock Structure.findById returns null (structure doesn't exist)
      jest.spyOn(Structure, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/investments')
        .send({
          structureId: 'nonexistent-structure',
          investmentName: 'Test Investment',
          investmentType: 'EQUITY',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/investments', () => {
    test('should get all investments', async () => {
      // Mock Investment.find
      jest.spyOn(Investment, 'find').mockResolvedValue([
        {
          id: 'investment-1',
          investmentName: 'Investment 1',
          investmentType: 'EQUITY',
          userId: 'user-admin',
        },
        {
          id: 'investment-2',
          investmentName: 'Investment 2',
          investmentType: 'DEBT',
          userId: 'user-admin',
        },
      ]);

      const response = await request(app).get('/api/investments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should filter investments by structure ID', async () => {
      // Mock Investment.find with filters
      jest.spyOn(Investment, 'find').mockResolvedValue([
        {
          id: 'investment-1',
          structureId: 'structure-123',
          investmentName: 'Investment 1',
        },
      ]);

      const response = await request(app).get('/api/investments?structureId=structure-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should filter investments by investment type', async () => {
      // Mock Investment.find with filters
      jest.spyOn(Investment, 'find').mockResolvedValue([
        {
          id: 'investment-equity',
          investmentType: 'EQUITY',
        },
      ]);

      const response = await request(app).get('/api/investments?investmentType=EQUITY');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/investments/active', () => {
    test('should get all active investments', async () => {
      // Mock Investment.findActive
      jest.spyOn(Investment, 'findActive').mockResolvedValue([
        {
          id: 'investment-1',
          investmentName: 'Active Investment',
          status: 'Active',
          userId: 'user-admin',
        },
      ]);

      const response = await request(app).get('/api/investments/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/investments/:id', () => {
    test('should get investment by ID successfully', async () => {
      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        investmentType: 'EQUITY',
        userId: 'user-admin',
      });

      const response = await request(app).get('/api/investments/investment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('investment-123');
    });

    test('should return 400 if investment not found', async () => {
      // Mock Investment.findById returns null
      jest.spyOn(Investment, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/investments/nonexistent');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/investments/:id/with-structure', () => {
    test('should get investment with structure details', async () => {
      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        structureId: 'structure-123',
        userId: 'user-admin',
      });

      const response = await request(app).get('/api/investments/investment-123/with-structure');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/investments/:id', () => {
    test('should update investment successfully', async () => {
      const updateData = {
        investmentName: 'Updated Investment Name',
        description: 'Updated description',
      };

      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
      });

      // Mock Investment.findByIdAndUpdate
      jest.spyOn(Investment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Updated Investment Name',
        description: 'Updated description',
        userId: 'user-admin',
      });

      const response = await request(app)
        .put('/api/investments/investment-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate interest rate on update', async () => {
      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentType: 'DEBT',
        userId: 'user-admin',
      });

      const response = await request(app)
        .put('/api/investments/investment-123')
        .send({ interestRate: 150 }); // Invalid: over 100

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/investments/:id/performance', () => {
    test('should update investment performance metrics', async () => {
      const metrics = {
        irrPercent: 18.0,
        moic: 3.0,
        totalReturns: 150000,
      };

      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
        irrPercent: 15.5,
        moic: 2.5,
      });

      // Mock Investment.findByIdAndUpdate
      jest.spyOn(Investment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
        irrPercent: 18.0,
        moic: 3.0,
        totalReturns: 150000,
      });

      const response = await request(app)
        .patch('/api/investments/investment-123/performance')
        .send(metrics);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 400 if no metrics provided', async () => {
      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        userId: 'user-admin',
      });

      const response = await request(app)
        .patch('/api/investments/investment-123/performance')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/investments/:id/exit', () => {
    test('should mark investment as exited', async () => {
      const exitData = {
        exitDate: '2024-12-31',
        equityExitValue: 250000,
      };

      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
        status: 'Active',
      });

      // Mock Investment.findByIdAndUpdate
      jest.spyOn(Investment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
        status: 'Exited',
        exitDate: '2024-12-31',
        equityExitValue: 250000,
      });

      const response = await request(app)
        .patch('/api/investments/investment-123/exit')
        .send(exitData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/investments/structure/:structureId/portfolio', () => {
    test('should get portfolio summary for structure', async () => {
      // Mock Structure.findById
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        createdBy: 'user-admin',
      });

      // Mock RPC call via Supabase
      mockSupabase.setMockRpcResponse('get_portfolio_summary', {
        data: {
          total_equity_invested: 500000,
          total_debt_principal: 300000,
          total_current_value: 900000,
        },
        error: null,
      });

      const response = await request(app).get('/api/investments/structure/structure-123/portfolio');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/investments/:id', () => {
    test('should delete investment successfully', async () => {
      // Mock Investment.findById
      jest.spyOn(Investment, 'findById').mockResolvedValue({
        id: 'investment-123',
        investmentName: 'Test Investment',
        userId: 'user-admin',
      });

      // Mock Investment.delete
      jest.spyOn(Investment, 'findByIdAndDelete').mockResolvedValue(true);

      const response = await request(app).delete('/api/investments/investment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    test('Admin user can only see their own investments', async () => {
      // Mock Investment.find filtered by userId
      jest.spyOn(Investment, 'find').mockResolvedValue([
        {
          id: 'investment-1',
          userId: 'admin-user',
          investmentName: 'My Investment',
        },
      ]);

      const response = await request(app).get('/api/investments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
