/**
 * Contract Template API Routes
 * Endpoints for managing contract templates and structure assignments
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  catchAsync,
  validate,
  NotFoundError
} = require('../middleware/errorHandler');
const { ContractTemplate, StructureContract, DocusealSubmission } = require('../models/supabase');
const {
  requireInvestmentManagerAccess,
  getUserContext
} = require('../middleware/rbac');

const router = express.Router();

// ============================================================
// Contract Template CRUD
// ============================================================

/**
 * @route   GET /api/contract-templates
 * @desc    List all contract templates
 * @access  Private
 */
router.get('/', authenticate, catchAsync(async (req, res) => {
  const { type, category, jurisdiction, isActive } = req.query;

  const filters = {};
  if (type) filters.type = type;
  if (category) filters.category = category;
  if (jurisdiction) filters.jurisdiction = jurisdiction;
  if (isActive !== undefined) filters.isActive = isActive;

  const templates = await ContractTemplate.getAll(filters);

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
}));

/**
 * @route   GET /api/contract-templates/pending-countersigns
 * @desc    Get submissions needing management countersignature
 * @access  Private (Investment Manager)
 */
router.get('/pending-countersigns', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const submissions = await DocusealSubmission.getPendingCountersigns();

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions
  });
}));

/**
 * @route   GET /api/contract-templates/:id
 * @desc    Get a single contract template by ID
 * @access  Private
 */
router.get('/:id', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const template = await ContractTemplate.getById(id);
  if (!template) {
    throw new NotFoundError('Contract template not found');
  }

  res.status(200).json({
    success: true,
    data: template
  });
}));

/**
 * @route   POST /api/contract-templates
 * @desc    Create a new contract template
 * @access  Private (Investment Manager)
 */
router.post('/', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { name, description, docusealTemplateUrl, type, signatureType, jurisdiction, category, displayOrder } = req.body;

  validate(name, 'Template name is required');
  validate(docusealTemplateUrl, 'DocuSeal template URL is required');

  if (type) {
    validate(['contract', 'action'].includes(type), 'Type must be "contract" or "action"');
  }
  if (signatureType) {
    validate(
      ['investor_only', 'management_only', 'investor_and_management'].includes(signatureType),
      'Invalid signature type'
    );
  }
  if (jurisdiction) {
    validate(['national', 'international'].includes(jurisdiction), 'Jurisdiction must be "national" or "international"');
  }
  if (category) {
    validate(
      ['subscription', 'side_letter', 'nda', 'action', 'other'].includes(category),
      'Invalid category'
    );
  }

  const template = await ContractTemplate.create({
    name: name.trim(),
    description: description?.trim() || null,
    docusealTemplateUrl: docusealTemplateUrl.trim(),
    type: type || 'contract',
    signatureType: signatureType || 'investor_only',
    jurisdiction: jurisdiction || null,
    category: category || 'subscription',
    displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0
  });

  res.status(201).json({
    success: true,
    message: 'Contract template created successfully',
    data: template
  });
}));

/**
 * @route   PUT /api/contract-templates/:id
 * @desc    Update a contract template
 * @access  Private (Investment Manager)
 */
router.put('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await ContractTemplate.getById(id);
  if (!existing) {
    throw new NotFoundError('Contract template not found');
  }

  const allowedFields = ['name', 'description', 'docusealTemplateUrl', 'type', 'signatureType', 'jurisdiction', 'category', 'displayOrder', 'isActive'];
  const updateData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  validate(Object.keys(updateData).length > 0, 'No data provided to update');

  if (updateData.name) updateData.name = updateData.name.trim();
  if (updateData.description) updateData.description = updateData.description.trim();
  if (updateData.docusealTemplateUrl) updateData.docusealTemplateUrl = updateData.docusealTemplateUrl.trim();
  if (updateData.isActive !== undefined) updateData.isActive = updateData.isActive === true || updateData.isActive === 'true';
  if (updateData.displayOrder !== undefined) updateData.displayOrder = parseInt(updateData.displayOrder);

  if (updateData.type) {
    validate(['contract', 'action'].includes(updateData.type), 'Type must be "contract" or "action"');
  }
  if (updateData.signatureType) {
    validate(
      ['investor_only', 'management_only', 'investor_and_management'].includes(updateData.signatureType),
      'Invalid signature type'
    );
  }

  const updated = await ContractTemplate.update(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Contract template updated successfully',
    data: updated
  });
}));

/**
 * @route   DELETE /api/contract-templates/:id
 * @desc    Delete a contract template
 * @access  Private (Investment Manager)
 */
router.delete('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await ContractTemplate.getById(id);
  if (!existing) {
    throw new NotFoundError('Contract template not found');
  }

  await ContractTemplate.delete(id);

  res.status(200).json({
    success: true,
    message: 'Contract template deleted successfully'
  });
}));

/**
 * @route   POST /api/contract-templates/countersign/:submissionId
 * @desc    Trigger management countersign for a submission
 * @access  Private (Investment Manager)
 */
router.post('/countersign/:submissionId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const { managementSubmissionId } = req.body;

  validate(submissionId, 'Submission ID is required');

  const submission = await DocusealSubmission.findById(submissionId);
  if (!submission) {
    throw new NotFoundError('Submission not found');
  }

  validate(submission.managementStatus === 'pending', 'Submission does not require management countersignature');

  const updated = await DocusealSubmission.updateManagementStatus(
    submissionId,
    managementSubmissionId ? 'completed' : 'pending',
    managementSubmissionId
  );

  res.status(200).json({
    success: true,
    message: managementSubmissionId ? 'Countersignature completed' : 'Countersign initiated',
    data: updated
  });
}));

module.exports = router;
