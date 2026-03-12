/**
 * Structure Contract Assignment Routes
 * Endpoints for managing contract template assignments to structures
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  catchAsync,
  validate,
  NotFoundError
} = require('../middleware/errorHandler');
const { StructureContract, ContractTemplate, Structure } = require('../models/supabase');
const {
  requireInvestmentManagerAccess
} = require('../middleware/rbac');

const router = express.Router();

/**
 * @route   GET /api/structures/:structureId/contracts
 * @desc    Get all contract assignments for a structure (with template data)
 * @access  Private
 */
router.get('/:structureId/contracts', authenticate, catchAsync(async (req, res) => {
  const { structureId } = req.params;

  const assignments = await StructureContract.getByStructureIdWithTemplates(structureId);

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
}));

/**
 * @route   GET /api/structures/:structureId/contracts/:triggerPoint
 * @desc    Get assignments filtered by trigger point
 * @access  Private
 */
router.get('/:structureId/contracts/:triggerPoint', authenticate, catchAsync(async (req, res) => {
  const { structureId, triggerPoint } = req.params;

  const validTriggerPoints = ['pre_payment', 'post_payment', 'post_closing', 'on_demand'];
  validate(validTriggerPoints.includes(triggerPoint), `Invalid trigger point. Must be one of: ${validTriggerPoints.join(', ')}`);

  const assignments = await StructureContract.getByStructureIdAndTrigger(structureId, triggerPoint);

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
}));

/**
 * @route   POST /api/structures/:structureId/contracts
 * @desc    Assign a contract template to a structure
 * @access  Private (Investment Manager)
 */
router.post('/:structureId/contracts', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { structureId } = req.params;
  const { contractTemplateId, triggerPoint, signer, isRequired, isBlocking, signingOrder, displayOrder } = req.body;

  validate(contractTemplateId, 'Contract template ID is required');

  // Verify template exists
  const template = await ContractTemplate.getById(contractTemplateId);
  if (!template) {
    throw new NotFoundError('Contract template not found');
  }

  if (triggerPoint) {
    validate(
      ['pre_payment', 'post_payment', 'post_closing', 'on_demand'].includes(triggerPoint),
      'Invalid trigger point'
    );
  }
  if (signer) {
    validate(
      ['investor', 'management', 'both_sequential'].includes(signer),
      'Invalid signer type'
    );
  }

  const assignment = await StructureContract.assign(structureId, contractTemplateId, {
    triggerPoint,
    signer,
    isRequired: isRequired !== undefined ? (isRequired === true || isRequired === 'true') : true,
    isBlocking: isBlocking !== undefined ? (isBlocking === true || isBlocking === 'true') : true,
    signingOrder: signingOrder !== undefined ? parseInt(signingOrder) : 0,
    displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0
  });

  res.status(201).json({
    success: true,
    message: 'Contract assigned to structure successfully',
    data: assignment
  });
}));

/**
 * @route   PUT /api/structures/:structureId/contracts/:assignmentId
 * @desc    Update a contract assignment's configuration
 * @access  Private (Investment Manager)
 */
router.put('/:structureId/contracts/:assignmentId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  const existing = await StructureContract.getById(assignmentId);
  if (!existing) {
    throw new NotFoundError('Contract assignment not found');
  }

  const allowedFields = ['triggerPoint', 'signer', 'isRequired', 'isBlocking', 'signingOrder', 'displayOrder'];
  const updateData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  validate(Object.keys(updateData).length > 0, 'No data provided to update');

  if (updateData.isRequired !== undefined) updateData.isRequired = updateData.isRequired === true || updateData.isRequired === 'true';
  if (updateData.isBlocking !== undefined) updateData.isBlocking = updateData.isBlocking === true || updateData.isBlocking === 'true';
  if (updateData.signingOrder !== undefined) updateData.signingOrder = parseInt(updateData.signingOrder);
  if (updateData.displayOrder !== undefined) updateData.displayOrder = parseInt(updateData.displayOrder);

  if (updateData.triggerPoint) {
    validate(
      ['pre_payment', 'post_payment', 'post_closing', 'on_demand'].includes(updateData.triggerPoint),
      'Invalid trigger point'
    );
  }
  if (updateData.signer) {
    validate(
      ['investor', 'management', 'both_sequential'].includes(updateData.signer),
      'Invalid signer type'
    );
  }

  const updated = await StructureContract.updateAssignment(assignmentId, updateData);

  res.status(200).json({
    success: true,
    message: 'Contract assignment updated successfully',
    data: updated
  });
}));

/**
 * @route   DELETE /api/structures/:structureId/contracts/:contractTemplateId
 * @desc    Remove a contract template assignment from a structure
 * @access  Private (Investment Manager)
 */
router.delete('/:structureId/contracts/:contractTemplateId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { structureId, contractTemplateId } = req.params;

  await StructureContract.unassign(structureId, contractTemplateId);

  res.status(200).json({
    success: true,
    message: 'Contract unassigned from structure successfully'
  });
}));

module.exports = router;
