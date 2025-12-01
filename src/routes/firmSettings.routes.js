/**
 * Firm Settings API Routes
 * Endpoints for managing firm/company settings
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const FirmSettings = require('../models/supabase/firmSettings');

const router = express.Router();

/**
 * @route   GET /api/firm-settings/health
 * @desc    Health check
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    service: 'Firm Settings API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/firm-settings
 * @desc    Get firm settings
 * @access  Private
 */
router.get('/', authenticate, catchAsync(async (req, res) => {
  let settings = await FirmSettings.get();

  // If no settings exist, initialize with defaults
  if (!settings) {
    settings = await FirmSettings.initializeDefaults();
  }

  res.status(200).json({
    success: true,
    data: settings
  });
}));

/**
 * @route   POST /api/firm-settings
 * @desc    Create firm settings (admin only)
 * @access  Private
 */
router.post('/', authenticate, catchAsync(async (req, res) => {
  const {
    firmName,
    firmLogo,
    firmDescription,
    firmWebsite,
    firmAddress,
    firmPhone,
    firmEmail
  } = req.body;

  // Check if settings already exist
  const existing = await FirmSettings.get();
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Firm settings already exist. Use PUT to update.'
    });
  }

  const settingsData = {
    firmName: firmName?.trim() || 'My Firm',
    firmLogo: firmLogo?.trim() || null,
    firmDescription: firmDescription?.trim() || '',
    firmWebsite: firmWebsite?.trim() || '',
    firmAddress: firmAddress?.trim() || '',
    firmPhone: firmPhone?.trim() || '',
    firmEmail: firmEmail?.trim() || ''
  };

  const settings = await FirmSettings.create(settingsData);

  res.status(201).json({
    success: true,
    message: 'Firm settings created successfully',
    data: settings
  });
}));

/**
 * @route   PUT /api/firm-settings
 * @desc    Update firm settings
 * @access  Private
 */
router.put('/', authenticate, catchAsync(async (req, res) => {
  const updateData = {};
  const allowedFields = [
    'firmName',
    'firmLogo',
    'firmDescription',
    'firmWebsite',
    'firmAddress',
    'firmPhone',
    'firmEmail'
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

  const settings = await FirmSettings.update(updateData);

  res.status(200).json({
    success: true,
    message: 'Firm settings updated successfully',
    data: settings
  });
}));

/**
 * @route   PUT /api/firm-settings/:id
 * @desc    Update firm settings by ID
 * @access  Private
 */
router.put('/:id', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const updateData = {};
  const allowedFields = [
    'firmName',
    'firmLogo',
    'firmDescription',
    'firmWebsite',
    'firmAddress',
    'firmPhone',
    'firmEmail'
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

  const settings = await FirmSettings.findByIdAndUpdate(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Firm settings updated successfully',
    data: settings
  });
}));

/**
 * @route   DELETE /api/firm-settings
 * @desc    Delete firm settings
 * @access  Private (admin only)
 */
router.delete('/', authenticate, catchAsync(async (req, res) => {
  await FirmSettings.delete();

  res.status(200).json({
    success: true,
    message: 'Firm settings deleted successfully'
  });
}));

module.exports = router;
