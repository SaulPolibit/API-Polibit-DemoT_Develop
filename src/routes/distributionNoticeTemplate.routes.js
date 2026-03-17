/**
 * Distribution Notice Template API Routes
 * Endpoints for managing per-structure distribution notice templates.
 * Templates are stored once per structure and reused across distributions.
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const { canCreate, getUserContext } = require('../middleware/rbac');
const DistributionNoticeTemplate = require('../models/supabase/distributionNoticeTemplate');

const router = express.Router();

/**
 * @route   GET /api/structures/:structureId/distribution-template
 * @desc    Get distribution notice template for a structure
 * @access  Private (Root, Admin)
 */
router.get('/:structureId/distribution-template', authenticate, catchAsync(async (req, res) => {
  const { structureId } = req.params;

  const template = await DistributionNoticeTemplate.findByStructureId(structureId);

  res.status(200).json({
    success: true,
    data: template,
  });
}));

/**
 * @route   PUT /api/structures/:structureId/distribution-template
 * @desc    Create or update distribution notice template for a structure
 * @access  Private (Root, Admin only)
 */
router.put('/:structureId/distribution-template', authenticate, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can manage distribution notice templates.',
    });
  }

  const { structureId } = req.params;
  const userId = req.auth.userId || req.user.id;

  const {
    headerTitle,
    headerSubtitle,
    includeFirmLogo,
    legalDescription,
    footerSignatoryName,
    footerSignatoryTitle,
    footerCompanyName,
    footerAdditionalNotes,
  } = req.body;

  const templateData = {};
  const allowedFields = {
    headerTitle,
    headerSubtitle,
    includeFirmLogo,
    legalDescription,
    footerSignatoryName,
    footerSignatoryTitle,
    footerCompanyName,
    footerAdditionalNotes,
  };

  for (const [key, value] of Object.entries(allowedFields)) {
    if (value !== undefined) {
      if (typeof value === 'string') {
        templateData[key] = value.trim();
      } else {
        templateData[key] = value;
      }
    }
  }

  validate(Object.keys(templateData).length > 0, 'No valid fields provided');

  templateData.createdBy = userId;

  const template = await DistributionNoticeTemplate.upsertByStructureId(structureId, templateData);

  res.status(200).json({
    success: true,
    message: 'Distribution notice template saved successfully',
    data: template,
  });
}));

/**
 * @route   DELETE /api/structures/:structureId/distribution-template
 * @desc    Delete distribution notice template for a structure
 * @access  Private (Root, Admin only)
 */
router.delete('/:structureId/distribution-template', authenticate, catchAsync(async (req, res) => {
  const { userRole } = getUserContext(req);

  if (!canCreate(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Root and Admin users can delete distribution notice templates.',
    });
  }

  const { structureId } = req.params;

  const deleted = await DistributionNoticeTemplate.deleteByStructureId(structureId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'No distribution notice template found for this structure.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Distribution notice template deleted successfully',
  });
}));

module.exports = router;
