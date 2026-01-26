/**
 * Distribution API Routes
 * Endpoints for managing distributions with waterfall calculations
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const { Distribution, Structure, User, FirmSettings } = require('../models/supabase');
const ApprovalHistory = require('../models/supabase/approvalHistory');
const { requireInvestmentManagerAccess, getUserContext, ROLES } = require('../middleware/rbac');
const { generateDistributionNoticePDF } = require('../services/documentGenerator');
const { sendEmail } = require('../utils/emailSender');

/**
 * Helper to get firm name for whitelabeling
 */
async function getFirmNameForUser(userId) {
  try {
    const firmSettings = await FirmSettings.findByUserId(userId);
    return firmSettings?.firmName || 'Investment Manager';
  } catch (error) {
    console.warn('Could not fetch firm settings:', error.message);
    return 'Investment Manager';
  }
}

const router = express.Router();

/**
 * @route   POST /api/distributions
 * @desc    Create a new distribution
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const userId = req.auth.userId || req.user.id;

  const {
    structureId,
    distributionNumber,
    distributionDate,
    totalAmount,
    source,
    notes,
    investmentId,
    sourceEquityGain,
    sourceDebtInterest,
    sourceDebtPrincipal,
    sourceOther,
    waterfallApplied,
    createAllocations,
    approvalStatus
  } = req.body;

  // Validate required fields
  validate(structureId, 'Structure ID is required');
  validate(distributionNumber, 'Distribution number is required');
  validate(totalAmount !== undefined && totalAmount > 0, 'Total amount must be positive');

  // Validate structure exists and belongs to user
  const structure = await Structure.findById(structureId);
  validate(structure, 'Structure not found');
  validate(structure.createdBy === userId, 'Structure does not belong to user');

  // Create distribution
  const distributionData = {
    structureId,
    distributionNumber: typeof distributionNumber === 'string' ? distributionNumber.trim() : distributionNumber,
    distributionDate: distributionDate || new Date().toISOString(),
    totalAmount,
    status: 'Draft',
    source: source?.trim() || '',
    notes: notes?.trim() || '',
    investmentId: investmentId || null,
    // Source breakdown
    sourceEquityGain: sourceEquityGain || 0,
    sourceDebtInterest: sourceDebtInterest || 0,
    sourceDebtPrincipal: sourceDebtPrincipal || 0,
    sourceOther: sourceOther || 0,
    // Waterfall
    waterfallApplied: waterfallApplied || false,
    tier1Amount: 0,
    tier2Amount: 0,
    tier3Amount: 0,
    tier4Amount: 0,
    // LP/GP splits
    lpTotalAmount: 0,
    gpTotalAmount: 0,
    managementFeeAmount: 0,
    // Approval workflow
    approvalStatus: approvalStatus || 'draft',
    createdBy: userId
  };

  const distribution = await Distribution.create(distributionData);

  // Optionally create allocations for all investors in structure
  let allocations = null;
  if (createAllocations === true) {
    allocations = await Distribution.createAllocationsForStructure(distribution.id, structureId);
  }

  res.status(201).json({
    success: true,
    message: 'Distribution created successfully',
    data: {
      distribution,
      allocations: allocations || []
    }
  });
}));

/**
 * @route   GET /api/distributions
 * @desc    Get all distributions (role-based filtering applied)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { structureId, status } = req.query;

  let filter = {};

  // Role-based filtering: Root sees all, Admin sees only their own
  if (userRole === ROLES.ADMIN) {
    filter.createdBy = userId;
  }
  // Root (role 0) sees all distributions, so no userId filter

  if (structureId) filter.structureId = structureId;
  if (status) filter.status = status;

  const distributions = await Distribution.find(filter);

  res.status(200).json({
    success: true,
    count: distributions.length,
    data: distributions
  });
}));

/**
 * @route   GET /api/distributions/:id
 * @desc    Get a single distribution by ID
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);

  validate(distribution, 'Distribution not found');

  // Root can access any distribution, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  res.status(200).json({
    success: true,
    data: distribution
  });
}));

/**
 * @route   GET /api/distributions/:id/with-allocations
 * @desc    Get distribution with investor allocations
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/with-allocations', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can access any distribution, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const distributionWithAllocations = await Distribution.findWithAllocations(id);

  res.status(200).json({
    success: true,
    data: distributionWithAllocations
  });
}));

/**
 * @route   GET /api/distributions/structure/:structureId/summary
 * @desc    Get distribution summary for a structure
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/structure/:structureId/summary', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { structureId } = req.params;

  const structure = await Structure.findById(structureId);
  validate(structure, 'Structure not found');

  // Root can access any structure, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(structure.createdBy === userId, 'Unauthorized access to structure');
  }

  const summary = await Distribution.getSummary(structureId);

  res.status(200).json({
    success: true,
    data: summary
  });
}));

/**
 * @route   PUT /api/distributions/:id
 * @desc    Update a distribution
 * @access  Private (requires authentication, Root/Admin only)
 */
router.put('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can edit any distribution, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const updateData = {};
  const allowedFields = [
    'distributionDate', 'totalAmount', 'source', 'notes', 'status',
    'sourceEquityGain', 'sourceDebtInterest', 'sourceDebtPrincipal', 'sourceOther',
    'waterfallApplied', 'tier1Amount', 'tier2Amount', 'tier3Amount', 'tier4Amount',
    'lpTotalAmount', 'gpTotalAmount', 'managementFeeAmount', 'approvalStatus'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  validate(Object.keys(updateData).length > 0, 'No valid fields provided for update');

  const updatedDistribution = await Distribution.findByIdAndUpdate(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Distribution updated successfully',
    data: updatedDistribution
  });
}));

/**
 * @route   POST /api/distributions/:id/apply-waterfall
 * @desc    Apply waterfall calculation to distribution
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/:id/apply-waterfall', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can edit any distribution, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }
  validate(!distribution.waterfallApplied, 'Waterfall already applied to this distribution');

  const structure = await Structure.findById(distribution.structureId);
  validate(structure, 'Structure not found');

  const waterfallResult = await Distribution.applyWaterfall(id);

  res.status(200).json({
    success: true,
    message: 'Waterfall calculation applied successfully',
    data: waterfallResult
  });
}));

/**
 * @route   PATCH /api/distributions/:id/mark-paid
 * @desc    Mark distribution as paid
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/mark-paid', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can edit any distribution, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const updatedDistribution = await Distribution.markAsPaid(id);

  res.status(200).json({
    success: true,
    message: 'Distribution marked as paid',
    data: updatedDistribution
  });
}));

/**
 * @route   POST /api/distributions/:id/create-allocations
 * @desc    Create allocations for all investors in structure
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/:id/create-allocations', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can edit any distribution, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const structure = await Structure.findById(distribution.structureId);
  validate(structure, 'Structure not found');

  const allocations = await Distribution.createAllocationsForStructure(id, distribution.structureId);

  res.status(201).json({
    success: true,
    message: 'Allocations created successfully',
    data: allocations
  });
}));

/**
 * @route   GET /api/distributions/investor/:investorId/total
 * @desc    Get total distributions for an investor in a structure
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/investor/:investorId/total', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { investorId } = req.params;
  const { structureId } = req.query;

  validate(structureId, 'Structure ID is required');

  const structure = await Structure.findById(structureId);
  validate(structure, 'Structure not found');

  // Root can access any structure, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(structure.createdBy === userId, 'Unauthorized access to structure');
  }

  const total = await Distribution.getInvestorDistributionTotal(investorId, structureId);

  res.status(200).json({
    success: true,
    data: total
  });
}));

/**
 * @route   DELETE /api/distributions/:id
 * @desc    Delete a distribution
 * @access  Private (requires authentication, Root/Admin only)
 */
router.delete('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can delete any distribution, Admin can only delete their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  await Distribution.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Distribution deleted successfully'
  });
}));

// ==========================================
// APPROVAL WORKFLOW ENDPOINTS
// ==========================================

/**
 * @route   GET /api/distributions/:id/approval-history
 * @desc    Get approval history for a distribution
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/approval-history', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can access any distribution, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const history = await ApprovalHistory.findByEntity('distribution', id);

  res.status(200).json({
    success: true,
    data: history
  });
}));

/**
 * @route   GET /api/distributions/pending/approval
 * @desc    Get all distributions pending approval
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/pending/approval', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { status } = req.query;

  let filter = {};

  // Filter by approval status - default to all pending statuses
  if (status) {
    filter.approvalStatus = status;
  } else {
    // Get all non-draft, non-approved, non-rejected items
    filter.approvalStatusIn = ['pending_review', 'pending_cfo'];
  }

  // Role-based filtering: Root sees all, Admin sees only their own
  if (userRole === ROLES.ADMIN) {
    filter.createdBy = userId;
  }

  const distributions = await Distribution.findByApprovalStatus(filter);

  res.status(200).json({
    success: true,
    count: distributions.length,
    data: distributions
  });
}));

/**
 * @route   PATCH /api/distributions/:id/submit-for-review
 * @desc    Submit distribution for review (draft -> pending_review)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/submit-for-review', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can edit any distribution, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }
  validate(distribution.approvalStatus === 'draft', 'Distribution must be in draft status to submit for review');

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedDistribution = await Distribution.findByIdAndUpdate(id, {
    approvalStatus: 'pending_review'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'distribution',
    entityId: id,
    action: 'submitted',
    fromStatus: 'draft',
    toStatus: 'pending_review',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { distributionNumber: distribution.distributionNumber }
  });

  // Send email notification to approvers (Root users)
  try {
    const rootUsers = await User.findByRole(0);
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(distribution.structureId);

    for (const approver of rootUsers) {
      if (approver?.email && approver.id !== userId) {
        await sendEmail(userId, {
          to: [approver.email],
          subject: `Action Required: Distribution #${distribution.distributionNumber} Awaiting Approval - ${structure?.name || 'Fund'}`,
          bodyText: `Dear ${approver.name},\n\nA distribution has been submitted for your review.\n\nDistribution #${distribution.distributionNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${distribution.totalAmount?.toLocaleString() || 'N/A'}\nSubmitted by: ${user?.name || 'Unknown'}\n\nPlease log in to review and approve.\n\nBest regards,\n${firmName}`,
          bodyHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #f39c12; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #856404;">Approval Required</h2>
              </div>
              <p>Dear ${approver.name},</p>
              <p>A distribution has been submitted for your review and approval.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Distribution:</strong> #${distribution.distributionNumber}</p>
                <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${distribution.totalAmount?.toLocaleString() || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${user?.name || 'Unknown'}</p>
              </div>
              <p>Please log in to the portal to review and approve this distribution.</p>
              <p>Best regards,<br/>${firmName}</p>
            </div>
          `
        });
      }
    }
  } catch (emailError) {
    console.warn('Failed to send approval notification:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'Distribution submitted for review',
    data: updatedDistribution
  });
}));

/**
 * @route   PATCH /api/distributions/:id/approve
 * @desc    Approve distribution (pending_review -> pending_cfo or approved)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/approve', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes, requireCFO = true } = req.body;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can approve any distribution, Admin can only approve their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }
  validate(
    distribution.approvalStatus === 'pending_review',
    'Distribution must be pending review to approve'
  );

  // Get user details for history
  const user = await User.findById(userId);

  // Determine next status
  const nextStatus = requireCFO ? 'pending_cfo' : 'approved';
  const action = requireCFO ? 'cfo_submitted' : 'approved';

  // Update approval status
  const updatedDistribution = await Distribution.findByIdAndUpdate(id, {
    approvalStatus: nextStatus
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'distribution',
    entityId: id,
    action,
    fromStatus: 'pending_review',
    toStatus: nextStatus,
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { distributionNumber: distribution.distributionNumber, requireCFO }
  });

  // Send email notification
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(distribution.structureId);

    if (requireCFO) {
      // Notify CFO (Root users) that approval is needed
      const rootUsers = await User.findByRole(0);
      for (const cfo of rootUsers) {
        if (cfo?.email) {
          await sendEmail(userId, {
            to: [cfo.email],
            subject: `CFO Approval Required: Distribution #${distribution.distributionNumber} - ${structure?.name || 'Fund'}`,
            bodyText: `Dear ${cfo.name},\n\nA distribution has been reviewed and approved by the operations team. It now requires your final approval.\n\nDistribution #${distribution.distributionNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${distribution.totalAmount?.toLocaleString() || 'N/A'}\nApproved by: ${user?.name || 'Unknown'}\n\nPlease log in to provide final approval.\n\nBest regards,\n${firmName}`,
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin-bottom: 20px;">
                  <h2 style="margin: 0; color: #0c5460;">CFO Approval Required</h2>
                </div>
                <p>Dear ${cfo.name},</p>
                <p>A distribution has been reviewed and approved by the operations team. It now requires your final approval.</p>
                <div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 0; color: #155724;"><strong>Initial Approval:</strong> Approved by ${user?.name || 'Unknown'}</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Distribution:</strong> #${distribution.distributionNumber}</p>
                  <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${distribution.totalAmount?.toLocaleString() || 'N/A'}</p>
                </div>
                <p>Please log in to the portal to provide final approval.</p>
                <p>Best regards,<br/>${firmName}</p>
              </div>
            `
          });
        }
      }
    } else {
      // Notify submitter that it's approved
      const creator = await User.findById(distribution.createdBy);
      if (creator?.email) {
        await sendEmail(userId, {
          to: [creator.email],
          subject: `Approved: Distribution #${distribution.distributionNumber} - ${structure?.name || 'Fund'}`,
          bodyText: `Dear ${creator.name},\n\nGreat news! Your distribution has been approved.\n\nDistribution #${distribution.distributionNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${distribution.totalAmount?.toLocaleString() || 'N/A'}\nApproved by: ${user?.name || 'Unknown'}\n\nYou can now proceed to process the distribution.\n\nBest regards,\n${firmName}`,
          bodyHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #155724;">Distribution Approved</h2>
              </div>
              <p>Dear ${creator.name},</p>
              <p>Great news! Your distribution has been approved and is ready for the next step.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Distribution:</strong> #${distribution.distributionNumber}</p>
                <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${distribution.totalAmount?.toLocaleString() || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Approved by:</strong> ${user?.name || 'Unknown'}</p>
              </div>
              <p><strong>Next Steps:</strong> You can now process the distribution to investors.</p>
              <p>Best regards,<br/>${firmName}</p>
            </div>
          `
        });
      }
    }
  } catch (emailError) {
    console.warn('Failed to send approval notification:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: requireCFO ? 'Distribution sent to CFO for approval' : 'Distribution approved',
    data: updatedDistribution
  });
}));

/**
 * @route   PATCH /api/distributions/:id/cfo-approve
 * @desc    CFO final approval (pending_cfo -> approved)
 * @access  Private (requires authentication, Root only - CFO)
 */
router.patch('/:id/cfo-approve', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  // Only Root (CFO) can do final approval
  validate(userRole === ROLES.ROOT, 'Only CFO can provide final approval');

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');
  validate(
    distribution.approvalStatus === 'pending_cfo',
    'Distribution must be pending CFO approval'
  );

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedDistribution = await Distribution.findByIdAndUpdate(id, {
    approvalStatus: 'approved'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'distribution',
    entityId: id,
    action: 'cfo_approved',
    fromStatus: 'pending_cfo',
    toStatus: 'approved',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { distributionNumber: distribution.distributionNumber }
  });

  // Send email notification to submitter
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(distribution.structureId);
    const creator = await User.findById(distribution.createdBy);

    if (creator?.email) {
      await sendEmail(userId, {
        to: [creator.email],
        subject: `CFO Approved: Distribution #${distribution.distributionNumber} - ${structure?.name || 'Fund'}`,
        bodyText: `Dear ${creator.name},\n\nGreat news! Your distribution has received final CFO approval.\n\nDistribution #${distribution.distributionNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${distribution.totalAmount?.toLocaleString() || 'N/A'}\nCFO Approved by: ${user?.name || 'Unknown'}\n\nYou can now proceed to process the distribution.\n\nBest regards,\n${firmName}`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #155724;">CFO Approval Confirmed</h2>
            </div>
            <p>Dear ${creator.name},</p>
            <p>Great news! Your distribution has received final CFO approval and is now ready to be processed.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Distribution:</strong> #${distribution.distributionNumber}</p>
              <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${distribution.totalAmount?.toLocaleString() || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>CFO Approved by:</strong> ${user?.name || 'Unknown'}</p>
            </div>
            <p><strong>Next Steps:</strong> You can now process the distribution to all investors.</p>
            <p>Best regards,<br/>${firmName}</p>
          </div>
        `
      });
    }
  } catch (emailError) {
    console.warn('Failed to send CFO approval notification:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'Distribution approved by CFO',
    data: updatedDistribution
  });
}));

/**
 * @route   PATCH /api/distributions/:id/reject
 * @desc    Reject distribution (any pending status -> rejected)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/reject', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { reason } = req.body;

  validate(reason?.trim(), 'Rejection reason is required');

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can reject any, Admin can only reject their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }
  validate(
    ['pending_review', 'pending_cfo'].includes(distribution.approvalStatus),
    'Distribution must be pending to reject'
  );

  // If pending CFO, only Root can reject
  if (distribution.approvalStatus === 'pending_cfo') {
    validate(userRole === ROLES.ROOT, 'Only CFO can reject at this stage');
  }

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedDistribution = await Distribution.findByIdAndUpdate(id, {
    approvalStatus: 'rejected'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'distribution',
    entityId: id,
    action: 'rejected',
    fromStatus: distribution.approvalStatus,
    toStatus: 'rejected',
    userId,
    userName: user?.name || 'Unknown',
    notes: reason,
    metadata: { distributionNumber: distribution.distributionNumber }
  });

  // Send email notification to submitter
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(distribution.structureId);
    const creator = await User.findById(distribution.createdBy);

    if (creator?.email) {
      await sendEmail(userId, {
        to: [creator.email],
        subject: `Rejected: Distribution #${distribution.distributionNumber} - ${structure?.name || 'Fund'}`,
        bodyText: `Dear ${creator.name},\n\nUnfortunately, your distribution has been rejected.\n\nDistribution #${distribution.distributionNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${distribution.totalAmount?.toLocaleString() || 'N/A'}\nRejected by: ${user?.name || 'Unknown'}\n\nReason for Rejection:\n${reason}\n\nPlease review the feedback and create a new distribution with the necessary corrections.\n\nBest regards,\n${firmName}`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #721c24;">Distribution Rejected</h2>
            </div>
            <p>Dear ${creator.name},</p>
            <p>Unfortunately, your distribution has been rejected and cannot proceed at this time.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Distribution:</strong> #${distribution.distributionNumber}</p>
              <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${distribution.totalAmount?.toLocaleString() || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Rejected by:</strong> ${user?.name || 'Unknown'}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Reason for Rejection</h4>
              <p style="margin: 0; color: #856404;">${reason}</p>
            </div>
            <p>Please review the feedback and create a new distribution with the necessary corrections.</p>
            <p>Best regards,<br/>${firmName}</p>
          </div>
        `
      });
    }
  } catch (emailError) {
    console.warn('Failed to send rejection notification:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'Distribution rejected',
    data: updatedDistribution
  });
}));

/**
 * @route   PATCH /api/distributions/:id/request-changes
 * @desc    Request changes on distribution (pending -> draft)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/request-changes', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  validate(notes?.trim(), 'Change request notes are required');

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can request changes on any, Admin can only on their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }
  validate(
    ['pending_review', 'pending_cfo'].includes(distribution.approvalStatus),
    'Distribution must be pending to request changes'
  );

  // If pending CFO, only Root can request changes
  if (distribution.approvalStatus === 'pending_cfo') {
    validate(userRole === ROLES.ROOT, 'Only CFO can request changes at this stage');
  }

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status back to draft
  const updatedDistribution = await Distribution.findByIdAndUpdate(id, {
    approvalStatus: 'draft'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'distribution',
    entityId: id,
    action: 'changes_requested',
    fromStatus: distribution.approvalStatus,
    toStatus: 'draft',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { distributionNumber: distribution.distributionNumber }
  });

  // Send email notification to creator about requested changes
  try {
    const creator = await User.findById(distribution.createdBy);
    if (creator?.email) {
      const firmName = await getFirmNameForUser(userId);
      await sendEmail(userId, {
        to: [creator.email],
        subject: `Changes Requested: Distribution #${distribution.distributionNumber}`,
        bodyText: `Changes have been requested on Distribution #${distribution.distributionNumber}.\n\nReviewer Notes:\n${notes}\n\nPlease review and resubmit.`,
        bodyHtml: `
          <p>Changes have been requested on <strong>Distribution #${distribution.distributionNumber}</strong>.</p>
          <h4>Reviewer Notes:</h4>
          <p style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">${notes}</p>
          <p>Please review and resubmit.</p>
          <p>Best regards,<br/>${firmName}</p>
        `
      });
    }
  } catch (emailError) {
    console.warn('Failed to send change request notification:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'Changes requested on distribution',
    data: updatedDistribution
  });
}));

/**
 * @route   GET /api/distributions/:id/generate-notice
 * @desc    Generate ILPA Distribution Notice PDF
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/generate-notice', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const defaultFirmName = await getFirmNameForUser(userId);
  const { firmName = defaultFirmName } = req.query;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can access any distribution, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const structure = await Structure.findById(distribution.structureId);
  validate(structure, 'Structure not found');

  // Get allocations
  const distributionWithAllocations = await Distribution.findWithAllocations(id);

  // Generate PDF
  const pdfBuffer = await generateDistributionNoticePDF(
    { ...distribution, allocations: distributionWithAllocations?.distribution_allocations || [] },
    structure,
    { firmName, bankDetails: structure.bankDetails }
  );

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ILPA_Distribution_${distribution.distributionNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}));

/**
 * @route   POST /api/distributions/:id/send-notices
 * @desc    Send ILPA Distribution Notices to all investors via email
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/:id/send-notices', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const defaultFirmName = await getFirmNameForUser(userId);
  const { firmName = defaultFirmName, subject, bodyText, bodyHtml } = req.body;

  const distribution = await Distribution.findById(id);
  validate(distribution, 'Distribution not found');

  // Root can access any distribution, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(distribution.createdBy === userId, 'Unauthorized access to distribution');
  }

  const structure = await Structure.findById(distribution.structureId);
  validate(structure, 'Structure not found');

  // Get allocations with investor details
  const distributionWithAllocations = await Distribution.findWithAllocations(id);
  const allocations = distributionWithAllocations?.distribution_allocations || [];

  validate(allocations.length > 0, 'No investor allocations found');

  const results = [];
  const errors = [];

  // Generate and send individual notices
  for (const allocation of allocations) {
    try {
      const investorId = allocation.user_id;
      const investor = allocation.user || await User.findById(investorId);

      if (!investor?.email) {
        errors.push({
          investorId,
          investorName: investor?.name || 'Unknown',
          error: 'No email address found'
        });
        continue;
      }

      // Generate distribution notice PDF for investor
      const pdfBuffer = await generateDistributionNoticePDF(
        { ...distribution, allocations: [allocation] },
        structure,
        { firmName, bankDetails: structure.bankDetails }
      );

      // Prepare email content
      const defaultSubject = `Distribution Notice #${distribution.distributionNumber} - ${structure.name}`;
      const defaultBodyText = `Dear ${investor.name},\n\nPlease find attached your Distribution Notice #${distribution.distributionNumber} for ${structure.name}.\n\nDistribution Amount: ${allocation.allocated_amount?.toLocaleString() || 'See attached'}\n\nPayment will be processed according to the details in the attached notice.\n\nBest regards,\n${firmName}`;
      const defaultBodyHtml = `
        <p>Dear ${investor.name},</p>
        <p>Please find attached your Distribution Notice #${distribution.distributionNumber} for <strong>${structure.name}</strong>.</p>
        <p><strong>Distribution Amount:</strong> ${allocation.allocated_amount?.toLocaleString() || 'See attached'}</p>
        <p>Payment will be processed according to the details in the attached notice.</p>
        <p>Best regards,<br/>${firmName}</p>
      `;

      // Send email with PDF attachment
      await sendEmail(userId, {
        to: [investor.email],
        subject: subject || defaultSubject,
        bodyText: bodyText || defaultBodyText,
        bodyHtml: bodyHtml || defaultBodyHtml,
        attachments: [{
          filename: `ILPA_Distribution_${distribution.distributionNumber}_${investor.name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer.toString('base64'),
          encoding: 'base64',
          contentType: 'application/pdf'
        }]
      });

      results.push({
        investorId,
        investorName: investor.name,
        email: investor.email,
        status: 'sent'
      });
    } catch (error) {
      errors.push({
        investorId: allocation.user_id,
        investorName: allocation.user?.name || 'Unknown',
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Notices sent to ${results.length} investor(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    data: {
      sent: results,
      failed: errors
    }
  });
}));

/**
 * @route   GET /api/distributions/health
 * @desc    Health check for Distribution API routes
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    service: 'Distribution API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
