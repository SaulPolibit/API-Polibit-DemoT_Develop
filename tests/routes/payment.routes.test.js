/**
 * Payment Routes Tests
 * Tests for src/routes/payment.routes.js
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

jest.mock('../../src/middleware/upload', () => ({
  handleDocumentUpload: (req, res, next) => next(),
}));

jest.mock('../../src/utils/fileUpload', () => ({
  uploadToSupabase: jest.fn(),
  deleteFromSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const { uploadToSupabase } = require('../../src/utils/fileUpload');
const Payment = require('../../src/models/supabase/payment');
const Structure = require('../../src/models/supabase/structure');

describe('Payment Routes', () => {
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
    const paymentRoutes = require('../../src/routes/payment.routes');
    app.use('/api/payments', paymentRoutes);
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('GET /api/payments/health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/payments/health');

      expect(response.status).toBe(200);
      expect(response.body.service).toBe('Payment API');
      expect(response.body.status).toBe('operational');
    });
  });

  describe('GET /api/payments/me', () => {
    test('should get all payments for authenticated user', async () => {
      // Mock Payment.findAll
      jest.spyOn(Payment, 'find').mockResolvedValue([
        {
          id: 'payment-1',
          userId: 'user-admin',
          structureId: 'structure-123',
          amount: 10000,
          status: 'pending',
        },
        {
          id: 'payment-2',
          userId: 'user-admin',
          structureId: 'structure-456',
          amount: 20000,
          status: 'completed',
        },
      ]);

      // Mock Structure.findById for structure lookups
      jest.spyOn(Structure, 'findById').mockResolvedValue({
        id: 'structure-123',
        name: 'Test Fund',
        type: 'Fund',
      });

      const response = await request(app).get('/api/payments/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/payments', () => {
    test('should create a new payment successfully', async () => {
      const paymentData = {
        email: 'investor@example.com',
        amount: '50000',
        structureId: 'structure-123',
        contractId: 'contract-123',
        paymentMethod: 'crypto',
        walletAddress: '0x1234567890abcdef',
      };

      // Mock Payment.create
      jest.spyOn(Payment, 'create').mockResolvedValue({
        id: 'payment-new',
        email: 'investor@example.com',
        amount: '50000',
        structureId: 'structure-123',
        contractId: 'contract-123',
        paymentMethod: 'crypto',
        walletAddress: '0x1234567890abcdef',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/payments')
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('50000');
    });
  });

  describe('GET /api/payments', () => {
    test('should get all payments with filters', async () => {
      // Mock Payment.findAll with filters
      jest.spyOn(Payment, 'find').mockResolvedValue([
        {
          id: 'payment-1',
          status: 'pending',
          amount: 10000,
        },
      ]);

      const response = await request(app).get('/api/payments?status=pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/payments/:id', () => {
    test('should get payment by ID successfully', async () => {
      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        email: 'investor@example.com',
        amount: 10000,
        status: 'pending',
      });

      const response = await request(app).get('/api/payments/payment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('payment-123');
    });

    test('should return 400 if payment not found', async () => {
      // Mock Payment.findById returns null
      jest.spyOn(Payment, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/payments/nonexistent');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payments/submission/:submissionId', () => {
    test('should get payment by submission ID', async () => {
      // Mock Payment.findBySubmissionId
      jest.spyOn(Payment, 'findBySubmissionId').mockResolvedValue({
        id: 'payment-123',
        submissionId: 'submission-abc',
        amount: 10000,
      });

      const response = await request(app).get('/api/payments/submission/submission-abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/payments/:id', () => {
    test('should update payment successfully', async () => {
      const updateData = {
        status: 'completed',
        paymentTransactionHash: '0xabcdef1234567890',
      };

      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
      });

      // Mock Payment.findByIdAndUpdate
      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        status: 'completed',
        paymentTransactionHash: '0xabcdef1234567890',
      });

      const response = await request(app)
        .put('/api/payments/payment-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/payments/:id/status', () => {
    test('should update payment status', async () => {
      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
      });

      // Mock Payment.findByIdAndUpdate
      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        status: 'completed',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate status values', async () => {
      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/status')
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/payments/:id', () => {
    test('should delete payment successfully', async () => {
      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        amount: 10000,
      });

      // Mock Payment.delete
      jest.spyOn(Payment, 'findByIdAndDelete').mockResolvedValue(true);

      const response = await request(app).delete('/api/payments/payment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/payments/:id/document', () => {
    test.skip('should upload payment document successfully', async () => {
      // TODO: This endpoint doesn't exist in the routes yet
      // Mock Payment.findById
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
      });

      // Mock Payment.findByIdAndUpdate
      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
        paymentImage: 'https://example.com/document.pdf',
      });

      // Mock file upload
      uploadToSupabase.mockResolvedValue({
        publicUrl: 'https://example.com/document.pdf',
        fileName: 'payment-doc.pdf',
        size: 2048,
      });

      const response = await request(app)
        .post('/api/payments/payment-123/document')
        .attach('document', Buffer.from('test pdf content'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/payments/structure/:structureId', () => {
    test('should get all payments for a structure', async () => {
      // Mock Payment.findByStructureId
      jest.spyOn(Payment, 'findByStructureId').mockResolvedValue([
        {
          id: 'payment-1',
          structureId: 'structure-123',
          amount: 10000,
        },
        {
          id: 'payment-2',
          structureId: 'structure-123',
          amount: 20000,
        },
      ]);

      const response = await request(app).get('/api/payments/structure/structure-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/payments/structure/:structureId/stats', () => {
    test.skip('should get payment statistics for structure', async () => {
      // TODO: This endpoint doesn't exist in the routes yet
      // Mock Payment.findByStructureId
      jest.spyOn(Payment, 'findByStructureId').mockResolvedValue([
        {
          id: 'payment-1',
          structureId: 'structure-123',
          amount: 10000,
          status: 'completed',
        },
        {
          id: 'payment-2',
          structureId: 'structure-123',
          amount: 20000,
          status: 'pending',
        },
      ]);

      const response = await request(app).get('/api/payments/structure/structure-123/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBeDefined();
      expect(response.body.data.count).toBeDefined();
    });
  });
});
