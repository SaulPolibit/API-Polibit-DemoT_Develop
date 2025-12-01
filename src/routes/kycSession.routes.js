/**
 * KYC Session API Routes
 * Endpoints for managing KYC verification sessions
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const KycSession = require('../models/supabase/kycSession');
const { User } = require('../models/supabase');

const router = express.Router();

/**
 * @route   GET /api/kyc-sessions/health
 * @desc    Health check
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    service: 'KYC Session API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/kyc-sessions
 * @desc    Create a new KYC session or return existing if user has kycId
 * @access  Private
 */
router.post('/', authenticate, catchAsync(async (req, res) => {
  const {
    userId,
    sessionId,
    provider,
    expiresAt
  } = req.body;

  validate(userId, 'User ID is required');
  validate(sessionId, 'Session ID is required');
  validate(provider, 'Provider is required');

  // Check if user already has a kycId
  const user = await User.findById(userId.trim());

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // If user already has a kycId, return the existing KYC session
  if (user.kycId) {
    const existingSession = await KycSession.findById(user.kycId);

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'User already has an existing KYC session',
        data: existingSession,
        isExisting: true
      });
    }
  }

  // Create new KYC session
  const sessionData = {
    userId: userId.trim(),
    sessionId: sessionId.trim(),
    provider: provider.trim(),
    status: 'pending',
    expiresAt: expiresAt || null,
    verificationData: {}
  };

  const session = await KycSession.create(sessionData);

  // Update user with the new kycId
  await User.findByIdAndUpdate(userId.trim(), {
    kycId: session.id
  });

  res.status(201).json({
    success: true,
    message: 'KYC session created successfully',
    data: session,
    isExisting: false
  });
}));

/**
 * @route   GET /api/kyc-sessions
 * @desc    Get all KYC sessions with filters
 * @access  Private
 */
router.get('/', authenticate, catchAsync(async (req, res) => {
  const { userId, provider, status } = req.query;

  let filter = {};
  if (userId) filter.userId = userId;
  if (provider) filter.provider = provider;
  if (status) filter.status = status;

  const sessions = await KycSession.find(filter);

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
}));

/**
 * @route   GET /api/kyc-sessions/:id
 * @desc    Get a single KYC session by ID
 * @access  Private
 */
router.get('/:id', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const session = await KycSession.findById(id);
  validate(session, 'KYC session not found');

  res.status(200).json({
    success: true,
    data: session
  });
}));

/**
 * @route   GET /api/kyc-sessions/session/:sessionId
 * @desc    Get KYC session by session ID
 * @access  Private
 */
router.get('/session/:sessionId', authenticate, catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const session = await KycSession.findBySessionId(sessionId);
  validate(session, 'KYC session not found');

  res.status(200).json({
    success: true,
    data: session
  });
}));

/**
 * @route   GET /api/kyc-sessions/user/:userId
 * @desc    Get all KYC sessions for a user
 * @access  Private
 */
router.get('/user/:userId', authenticate, catchAsync(async (req, res) => {
  const { userId } = req.params;

  const sessions = await KycSession.findByUserId(userId);

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
}));

/**
 * @route   GET /api/kyc-sessions/user/:userId/latest
 * @desc    Get latest KYC session for a user
 * @access  Private
 */
router.get('/user/:userId/latest', authenticate, catchAsync(async (req, res) => {
  const { userId } = req.params;

  const session = await KycSession.getLatestForUser(userId);
  validate(session, 'No KYC sessions found for this user');

  res.status(200).json({
    success: true,
    data: session
  });
}));

/**
 * @route   GET /api/kyc-sessions/status/:status
 * @desc    Get KYC sessions by status
 * @access  Private
 */
router.get('/status/:status', authenticate, catchAsync(async (req, res) => {
  const { status } = req.params;

  const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'expired'];
  validate(
    validStatuses.includes(status),
    `Status must be one of: ${validStatuses.join(', ')}`
  );

  const sessions = await KycSession.findByStatus(status);

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
}));

/**
 * @route   PUT /api/kyc-sessions/:id
 * @desc    Update a KYC session
 * @access  Private
 */
router.put('/:id', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const session = await KycSession.findById(id);
  validate(session, 'KYC session not found');

  const updateData = {};
  const allowedFields = [
    'status',
    'verificationData',
    'pdfUrl',
    'completedAt',
    'expiresAt'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] === 'string') {
        updateData[field] = req.body[field].trim();
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  validate(Object.keys(updateData).length > 0, 'No valid fields provided for update');

  const updatedSession = await KycSession.findByIdAndUpdate(id, updateData);

  res.status(200).json({
    success: true,
    message: 'KYC session updated successfully',
    data: updatedSession
  });
}));

/**
 * @route   PATCH /api/kyc-sessions/:id/complete
 * @desc    Mark KYC session as completed
 * @access  Private
 */
router.patch('/:id/complete', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { verificationData, pdfUrl } = req.body;

  validate(verificationData, 'Verification data is required');

  const session = await KycSession.findById(id);
  validate(session, 'KYC session not found');

  const updatedSession = await KycSession.complete(id, verificationData, pdfUrl);

  res.status(200).json({
    success: true,
    message: 'KYC session completed successfully',
    data: updatedSession
  });
}));

/**
 * @route   PATCH /api/kyc-sessions/:id/fail
 * @desc    Mark KYC session as failed
 * @access  Private
 */
router.patch('/:id/fail', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const session = await KycSession.findById(id);
  validate(session, 'KYC session not found');

  const updatedSession = await KycSession.fail(id, reason);

  res.status(200).json({
    success: true,
    message: 'KYC session marked as failed',
    data: updatedSession
  });
}));

/**
 * @route   DELETE /api/kyc-sessions/:id
 * @desc    Delete a KYC session
 * @access  Private
 */
router.delete('/:id', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const session = await KycSession.findById(id);
  validate(session, 'KYC session not found');

  await KycSession.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'KYC session deleted successfully'
  });
}));

module.exports = router;
