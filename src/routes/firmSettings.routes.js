/**
 * Firm Settings API Routes
 * Endpoints for managing firm/company settings
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const FirmSettings = require('../models/supabase/firmSettings');
const { handleFirmLogoUpload } = require('../middleware/upload');
const { uploadToSupabase } = require('../utils/fileUpload');
const { canCreate, getUserContext, ROLES } = require('../middleware/rbac');
const { generateThemePalette } = require('../utils/themeGenerator');

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
 * @route   GET /api/firm-settings/logo
 * @desc    Get firm logo and name (public endpoint)
 * @access  Public
 */
router.get('/logo', catchAsync(async (_req, res) => {
  // Get the firm settings (single record)
  const settings = await FirmSettings.get();

  res.status(200).json({
    success: true,
    data: {
      firmLogo: settings?.firmLogo || null,
      firmName: settings?.firmName || 'PoliBit',
      signInBackground: settings?.signInBackground || null
    }
  });
}));

/**
 * @route   GET /api/firm-settings/theme
 * @desc    Get firm theme as pre-computed CSS variables (public endpoint)
 * @access  Public
 */
router.get('/theme', catchAsync(async (_req, res) => {
  const settings = await FirmSettings.get();

  if (!settings?.themeConfig?.primaryColor) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  const { cssVariables, fontUrl } = generateThemePalette(settings.themeConfig);

  res.status(200).json({
    success: true,
    data: {
      cssVariables,
      fontUrl,
      themeConfig: settings.themeConfig
    }
  });
}));

/**
 * @route   GET /api/firm-settings
 * @desc    Get global firm settings
 * @access  Private
 */
router.get('/', authenticate, catchAsync(async (req, res) => {
  // Get global settings
  const settings = await FirmSettings.get();

  // Return defaults if no settings exist yet (first-time setup)
  res.status(200).json({
    success: true,
    data: settings || {
      firmName: 'My Firm',
      firmLogo: null,
      firmDescription: null,
      firmWebsite: null,
      firmAddress: null,
      firmPhone: null,
      firmEmail: null,
      signInBackground: null,
      themeConfig: null,
      navVisibilityConfig: null,
    }
  });
}));

/**
 * @route   POST /api/firm-settings
 * @desc    Create global firm settings
 * @access  Private (Root, Admin only)
 */
router.post('/', authenticate, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  // Block GUEST, SUPPORT, and INVESTOR from creating
  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can create firm settings.'
    });
  }

  const userId = req.auth.userId || req.user.id;

  const {
    firmName,
    firmLogo,
    firmDescription,
    firmWebsite,
    firmAddress,
    firmPhone,
    firmEmail
  } = req.body;

  // Check if global settings already exist
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
    firmEmail: firmEmail?.trim() || '',
    userId  // Track who created it
  };

  const settings = await FirmSettings.create(settingsData);

  res.status(201).json({
    success: true,
    message: 'Firm settings created successfully',
    data: settings
  });
}));

/**
 * @route   GET /api/firm-settings/nav-visibility
 * @desc    Get navigation visibility config
 * @access  Private (authenticated)
 */
router.get('/nav-visibility', authenticate, catchAsync(async (req, res) => {
  const settings = await FirmSettings.get();

  res.status(200).json({
    success: true,
    data: settings?.navVisibilityConfig || null
  });
}));

/**
 * @route   PUT /api/firm-settings/nav-visibility
 * @desc    Update navigation visibility config
 * @access  Private (Root only)
 */
router.put('/nav-visibility', authenticate, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  // Root only
  if (userRole !== ROLES.ROOT) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root users can update navigation visibility.'
    });
  }

  const { investmentManager, lpPortal, features } = req.body;
  validate(investmentManager || lpPortal || features, 'No navigation visibility data provided');

  const navVisibilityConfig = { investmentManager, lpPortal, features };

  const existingSettings = await FirmSettings.get();

  if (!existingSettings) {
    return res.status(404).json({
      success: false,
      message: 'No firm settings found. Please create firm settings first.'
    });
  }

  const settings = await FirmSettings.findByIdAndUpdate(existingSettings.id, {
    navVisibilityConfig
  });

  res.status(200).json({
    success: true,
    message: 'Navigation visibility updated successfully',
    data: settings.navVisibilityConfig
  });
}));

/**
 * @route   PUT /api/firm-settings
 * @desc    Update global firm settings
 * @access  Private (Root, Admin only)
 * @body    FormData with optional 'firmLogo' file field and other fields
 */
router.put('/', authenticate, handleFirmLogoUpload, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  // Block GUEST, SUPPORT, and INVESTOR from updating
  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can update firm settings.'
    });
  }

  const userId = req.auth.userId || req.user.id;

  // Get existing global settings — auto-create if none exist
  let existingSettings = await FirmSettings.get();

  if (!existingSettings) {
    // Auto-create default firm settings record
    existingSettings = await FirmSettings.create({ firmName: 'My Firm', userId });
  }

  const updateData = {};
  const allowedFields = [
    'firmName',
    'firmLogo',
    'firmDescription',
    'firmWebsite',
    'firmAddress',
    'firmPhone',
    'firmEmail',
    'signInBackground',
    'themeConfig'
  ];

  // Handle file uploads if present (firmLogo and/or signInBackground)
  const firmLogoFile = req.files?.firmLogo?.[0];
  const signInBgFile = req.files?.signInBackground?.[0];

  if (firmLogoFile) {
    try {
      const uploadResult = await uploadToSupabase(
        firmLogoFile.buffer,
        firmLogoFile.originalname,
        firmLogoFile.mimetype,
        'firm-logos',
        'firm-logos'
      );
      updateData.firmLogo = uploadResult.publicUrl;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error uploading firm logo: ${error.message}`
      });
    }
  }

  if (signInBgFile) {
    try {
      const uploadResult = await uploadToSupabase(
        signInBgFile.buffer,
        signInBgFile.originalname,
        signInBgFile.mimetype,
        'sign-in-backgrounds',
        'firm-logos'
      );
      updateData.signInBackground = uploadResult.publicUrl;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error uploading sign-in background: ${error.message}`
      });
    }
  }

  // Process other fields from request body
  for (const field of allowedFields) {
    // Skip file fields if already set from upload
    if (field === 'firmLogo' && firmLogoFile) continue;
    if (field === 'signInBackground' && signInBgFile) continue;

    if (req.body[field] !== undefined) {
      if (field === 'themeConfig') {
        updateData[field] = typeof req.body[field] === 'string'
          ? JSON.parse(req.body[field])
          : req.body[field];
      } else if (typeof req.body[field] === 'string') {
        updateData[field] = req.body[field].trim();
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  validate(Object.keys(updateData).length > 0, 'No valid fields provided for update');

  // Add userId to track who made the update
  updateData.userId = userId;

  // Update using the existing settings ID
  const settings = await FirmSettings.findByIdAndUpdate(existingSettings.id, updateData);

  res.status(200).json({
    success: true,
    message: 'Firm settings updated successfully',
    data: settings
  });
}));

/**
 * @route   PUT /api/firm-settings/:id
 * @desc    Update global firm settings by ID
 * @access  Private (Root, Admin only)
 * @body    FormData with optional 'firmLogo'/'signInBackground' file fields and other fields
 */
router.put('/:id', authenticate, handleFirmLogoUpload, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  // Block GUEST, SUPPORT, and INVESTOR from updating
  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can update firm settings.'
    });
  }

  const userId = req.auth.userId || req.user.id;
  const { id } = req.params;

  // Verify the settings exist
  const existingSettings = await FirmSettings.findById(id);
  validate(existingSettings, 'Firm settings not found');

  const updateData = {};
  const allowedFields = [
    'firmName',
    'firmLogo',
    'firmDescription',
    'firmWebsite',
    'firmAddress',
    'firmPhone',
    'firmEmail',
    'signInBackground',
    'themeConfig'
  ];

  // Handle file uploads if present
  const firmLogoFile = req.files?.firmLogo?.[0];
  const signInBgFile = req.files?.signInBackground?.[0];

  if (firmLogoFile) {
    try {
      const uploadResult = await uploadToSupabase(
        firmLogoFile.buffer,
        firmLogoFile.originalname,
        firmLogoFile.mimetype,
        'firm-logos',
        'firm-logos'
      );
      updateData.firmLogo = uploadResult.publicUrl;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error uploading firm logo: ${error.message}`
      });
    }
  }

  if (signInBgFile) {
    try {
      const uploadResult = await uploadToSupabase(
        signInBgFile.buffer,
        signInBgFile.originalname,
        signInBgFile.mimetype,
        'sign-in-backgrounds',
        'firm-logos'
      );
      updateData.signInBackground = uploadResult.publicUrl;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error uploading sign-in background: ${error.message}`
      });
    }
  }

  // Process other fields from request body
  for (const field of allowedFields) {
    if (field === 'firmLogo' && firmLogoFile) continue;
    if (field === 'signInBackground' && signInBgFile) continue;

    if (req.body[field] !== undefined) {
      if (field === 'themeConfig') {
        updateData[field] = typeof req.body[field] === 'string'
          ? JSON.parse(req.body[field])
          : req.body[field];
      } else if (typeof req.body[field] === 'string') {
        updateData[field] = req.body[field].trim();
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  validate(Object.keys(updateData).length > 0, 'No valid fields provided for update');

  // Add userId to track who made the update
  updateData.userId = userId;

  const settings = await FirmSettings.findByIdAndUpdate(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Firm settings updated successfully',
    data: settings
  });
}));

/**
 * @route   DELETE /api/firm-settings
 * @desc    Delete global firm settings
 * @access  Private (Root, Admin only)
 */
router.delete('/', authenticate, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  // Block GUEST, SUPPORT, and INVESTOR from deleting
  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can delete firm settings.'
    });
  }

  // Get global settings
  const settings = await FirmSettings.get();
  validate(settings, 'No firm settings found');

  // Delete by ID
  await FirmSettings.findByIdAndDelete(settings.id);

  res.status(200).json({
    success: true,
    message: 'Firm settings deleted successfully'
  });
}));

module.exports = router;
