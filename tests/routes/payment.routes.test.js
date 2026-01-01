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

  describe('GET /api/payments/email/:email', () => {
    test('should get all payments for a specific email', async () => {
      jest.spyOn(Payment, 'findByEmail').mockResolvedValue([
        {
          id: 'payment-1',
          email: 'test@example.com',
          amount: 10000,
          status: 'pending',
        },
        {
          id: 'payment-2',
          email: 'test@example.com',
          amount: 20000,
          status: 'completed',
        },
      ]);

      const response = await request(app).get('/api/payments/email/test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/payments/transaction/:paymentTransactionHash', () => {
    test('should get payment by transaction hash', async () => {
      jest.spyOn(Payment, 'findByTransactionHash').mockResolvedValue({
        id: 'payment-1',
        paymentTransactionHash: '0xabc123',
        amount: 10000,
      });

      const response = await request(app).get('/api/payments/transaction/0xabc123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentTransactionHash).toBe('0xabc123');
    });

    test('should return 400 if payment not found for transaction hash', async () => {
      jest.spyOn(Payment, 'findByTransactionHash').mockResolvedValue(null);

      const response = await request(app).get('/api/payments/transaction/0xinvalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payments/contract/:contractId', () => {
    test('should get all payments for a specific contract', async () => {
      jest.spyOn(Payment, 'findByContractId').mockResolvedValue([
        {
          id: 'payment-1',
          contractId: 'contract-123',
          amount: 10000,
        },
        {
          id: 'payment-2',
          contractId: 'contract-123',
          amount: 20000,
        },
      ]);

      const response = await request(app).get('/api/payments/contract/contract-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });
  });

  describe('GET /api/payments/status/:status', () => {
    test('should get all payments by status', async () => {
      jest.spyOn(Payment, 'findByStatus').mockResolvedValue([
        {
          id: 'payment-1',
          status: 'pending',
          amount: 10000,
        },
        {
          id: 'payment-2',
          status: 'pending',
          amount: 20000,
        },
      ]);

      const response = await request(app).get('/api/payments/status/pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app).get('/api/payments/status/invalid-status');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments - RBAC and validation', () => {
    test('should return 403 for GUEST users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-guest', userRole: 4 }; // GUEST role
        req.user = { id: 'user-guest', role: 4 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .post('/api/payments')
        .send({
          email: 'test@example.com',
          amount: '10000',
          structureId: 'structure-123',
          contractId: 'contract-456',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Guest users cannot create payments');
    });

    test('should generate submission ID if not provided', async () => {
      jest.spyOn(Payment, 'create').mockResolvedValue({
        id: 'payment-new',
        submissionId: 'PAY-123456-abcd',
        email: 'test@example.com',
        amount: '10000',
      });

      const response = await request(app)
        .post('/api/payments')
        .send({
          email: 'test@example.com',
          amount: '10000',
          structureId: 'structure-123',
          contractId: 'contract-456',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should handle file upload when file is provided', async () => {
      const app3 = express();
      app3.use(express.json());
      app3.use((req, res, next) => {
        req.auth = { userId: 'user-admin', userRole: 0 };
        req.user = { id: 'user-admin', role: 0 };
        req.file = {
          buffer: Buffer.from('test'),
          originalname: 'payment.pdf',
          mimetype: 'application/pdf',
        };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app3.use('/api/payments', paymentRoutes);

      uploadToSupabase.mockResolvedValue({
        publicUrl: 'https://example.com/payment.pdf',
        fileName: 'payment.pdf',
        size: 1024,
      });

      jest.spyOn(Payment, 'create').mockResolvedValue({
        id: 'payment-new',
        submissionId: 'PAY-123',
        email: 'test@example.com',
        paymentImage: 'https://example.com/payment.pdf',
      });

      const response = await request(app3)
        .post('/api/payments')
        .send({
          email: 'test@example.com',
          amount: '10000',
          structureId: 'structure-123',
          contractId: 'contract-456',
        });

      expect(response.status).toBe(201);
      expect(uploadToSupabase).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/me - error handling', () => {
    test('should handle structure fetch error gracefully', async () => {
      jest.spyOn(Payment, 'find').mockResolvedValue([
        {
          id: 'payment-1',
          userId: 'user-admin',
          structureId: 'structure-123',
          amount: 10000,
        },
      ]);

      jest.spyOn(Structure, 'findById').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/payments/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].structure).toBeNull();
    });
  });

  describe('GET /api/payments - error handling', () => {
    test('should handle user fetch error gracefully', async () => {
      const { User } = require('../../src/models/supabase');

      jest.spyOn(Payment, 'find').mockResolvedValue([
        {
          id: 'payment-1',
          userId: 'user-123',
          structureId: 'structure-123',
          amount: 10000,
        },
      ]);

      jest.spyOn(User, 'findById').mockRejectedValue(new Error('User fetch error'));
      jest.spyOn(Structure, 'findById').mockRejectedValue(new Error('Structure fetch error'));

      const response = await request(app).get('/api/payments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].user).toBeNull();
      expect(response.body.data[0].structure).toBeNull();
    });
  });

  describe('PUT /api/payments/:id - RBAC and validation', () => {
    test('should return 403 for INVESTOR users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-investor', userRole: 3 }; // INVESTOR role
        req.user = { id: 'user-investor', role: 3 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .put('/api/payments/payment-123')
        .send({ status: 'completed' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Only Root, Admin, and Staff users can update payments');
    });

    test('should update email field with lowercase', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        email: 'old@example.com',
      });

      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        email: 'new@example.com',
      });

      const response = await request(app)
        .put('/api/payments/payment-123')
        .send({ email: 'NEW@EXAMPLE.COM' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update tokens field as integer', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        tokens: 100,
      });

      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        tokens: 200,
      });

      const response = await request(app)
        .put('/api/payments/payment-123')
        .send({ tokens: '200' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle file upload in update', async () => {
      const app3 = express();
      app3.use(express.json());
      app3.use((req, res, next) => {
        req.auth = { userId: 'user-admin', userRole: 0 };
        req.user = { id: 'user-admin', role: 0 };
        req.file = {
          buffer: Buffer.from('test'),
          originalname: 'updated.pdf',
          mimetype: 'application/pdf',
        };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app3.use('/api/payments', paymentRoutes);

      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        submissionId: 'PAY-123',
        status: 'pending',
      });

      uploadToSupabase.mockResolvedValue({
        publicUrl: 'https://example.com/updated.pdf',
      });

      jest.spyOn(Payment, 'findByIdAndUpdate').mockResolvedValue({
        id: 'payment-123',
        paymentImage: 'https://example.com/updated.pdf',
        status: 'pending',
      });

      const response = await request(app3)
        .put('/api/payments/payment-123')
        .send({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(uploadToSupabase).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/payments/:id/status - RBAC', () => {
    test('should return 403 for GUEST users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-guest', userRole: 4 };
        req.user = { id: 'user-guest', role: 4 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Guest and Investor users cannot update payment status');
    });

    test('should return 403 for INVESTOR users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-investor', userRole: 3 };
        req.user = { id: 'user-investor', role: 3 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/payments/:id/payment-transaction - RBAC', () => {
    test('should update payment transaction hash', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        paymentTransactionHash: null,
      });

      jest.spyOn(Payment, 'updateTransactionHash').mockResolvedValue({
        id: 'payment-123',
        paymentTransactionHash: '0xabc123',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/payment-transaction')
        .send({ paymentTransactionHash: '0xabc123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 403 for GUEST users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-guest', userRole: 4 };
        req.user = { id: 'user-guest', role: 4 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/payment-transaction')
        .send({ paymentTransactionHash: '0xabc' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Guest and Investor users cannot update payment transactions');
    });

    test('should return 403 for INVESTOR users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-investor', userRole: 3 };
        req.user = { id: 'user-investor', role: 3 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/payment-transaction')
        .send({ paymentTransactionHash: '0xabc' });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/payments/:id/token-transaction - RBAC', () => {
    test('should update token transaction hash', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        mintTransactionHash: null,
      });

      jest.spyOn(Payment, 'updateTokenTransactionHash').mockResolvedValue({
        id: 'payment-123',
        mintTransactionHash: '0xdef456',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/token-transaction')
        .send({ mintTransactionHash: '0xdef456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 403 for GUEST users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-guest', userRole: 4 };
        req.user = { id: 'user-guest', role: 4 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/token-transaction')
        .send({ mintTransactionHash: '0xdef' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Guest and Investor users cannot update token transactions');
    });

    test('should return 403 for INVESTOR users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-investor', userRole: 3 };
        req.user = { id: 'user-investor', role: 3 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2)
        .patch('/api/payments/payment-123/token-transaction')
        .send({ mintTransactionHash: '0xdef' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/payments/:id - RBAC', () => {
    test('should return 403 for GUEST users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-guest', userRole: 4 };
        req.user = { id: 'user-guest', role: 4 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2).delete('/api/payments/payment-123');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Guest and Investor users cannot delete payments');
    });

    test('should return 403 for INVESTOR users', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        req.auth = { userId: 'user-investor', userRole: 3 };
        req.user = { id: 'user-investor', role: 3 };
        next();
      });
      const paymentRoutes = require('../../src/routes/payment.routes');
      app2.use('/api/payments', paymentRoutes);

      const response = await request(app2).delete('/api/payments/payment-123');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/payments/approvals/stats', () => {
    test('should get payment statistics', async () => {
      jest.spyOn(Payment, 'getStats').mockResolvedValue({
        total: 100,
        pending: 20,
        approved: 60,
        rejected: 20,
      });

      const response = await request(app).get('/api/payments/approvals/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(100);
    });
  });

  describe('PATCH /api/payments/:id/approve', () => {
    test('should approve a payment', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
        amount: 10000,
      });

      jest.spyOn(Payment, 'approve').mockResolvedValue({
        id: 'payment-123',
        status: 'approved',
        amount: 10000,
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/approve')
        .send({ adminNotes: 'Approved by admin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment approved successfully');
    });

    test('should return 400 if payment already processed', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'approved',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/approve')
        .send({ adminNotes: 'Note' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/payments/:id/reject', () => {
    test('should reject a payment', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
        amount: 10000,
      });

      jest.spyOn(Payment, 'reject').mockResolvedValue({
        id: 'payment-123',
        status: 'rejected',
        amount: 10000,
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/reject')
        .send({ adminNotes: 'Invalid payment details' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment rejected successfully');
    });

    test('should return 400 if payment already processed', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'rejected',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/reject')
        .send({ adminNotes: 'Already rejected' });

      expect(response.status).toBe(400);
    });

    test('should return 400 if adminNotes not provided', async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue({
        id: 'payment-123',
        status: 'pending',
      });

      const response = await request(app)
        .patch('/api/payments/payment-123/reject')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
