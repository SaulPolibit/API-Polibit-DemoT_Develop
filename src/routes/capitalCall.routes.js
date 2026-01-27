/**
 * Capital Call API Routes
 * Endpoints for managing capital calls and investor allocations
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, validate } = require('../middleware/errorHandler');
const { CapitalCall, Structure, User, FirmSettings } = require('../models/supabase');
const ApprovalHistory = require('../models/supabase/approvalHistory');
const { requireInvestmentManagerAccess, getUserContext, ROLES } = require('../middleware/rbac');
const { generateCapitalCallNoticePDF, generateIndividualLPNoticePDF } = require('../services/documentGenerator');
const { sendEmail } = require('../utils/emailSender');

/**
 * Helper to get firm name for whitelabeling
 * Uses firm settings from database, falls back to default
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
 * @route   POST /api/capital-calls
 * @desc    Create a new capital call
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const userId = req.auth.userId || req.user.id;

  const {
    structureId,
    callNumber,
    callDate,
    dueDate,
    totalCallAmount,
    purpose,
    notes,
    investmentId,
    createAllocations,
    // ILPA Fee Configuration
    managementFeeBase,
    managementFeeRate,
    vatRate,
    vatApplicable,
    feePeriod,
    approvalStatus,
    // Proximity Dual-Rate Fee Fields
    feeRateOnNic,
    feeRateOnUnfunded
  } = req.body;

  // Validate required fields
  validate(structureId, 'Structure ID is required');
  validate(callNumber, 'Call number is required');
  validate(totalCallAmount !== undefined && totalCallAmount > 0, 'Total call amount must be positive');

  // Validate structure exists and belongs to user
  const structure = await Structure.findById(structureId);
  validate(structure, 'Structure not found');
  validate(structure.createdBy === userId, 'Structure does not belong to user');

  // Create capital call
  const capitalCallData = {
    structureId,
    callNumber: typeof callNumber === 'string' ? callNumber.trim() : callNumber,
    callDate: callDate || new Date().toISOString(),
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
    totalCallAmount,
    totalPaidAmount: 0,
    totalUnpaidAmount: totalCallAmount,
    status: 'Draft',
    purpose: purpose?.trim() || '',
    notes: notes?.trim() || '',
    investmentId: investmentId || null,
    // ILPA Fee Configuration
    managementFeeBase: managementFeeBase || structure.managementFeeBase || 'committed',
    managementFeeRate: managementFeeRate !== undefined ? managementFeeRate : structure.managementFee || 2.0,
    vatRate: vatRate !== undefined ? vatRate : parseFloat(structure.vatRate) || 0,
    vatApplicable: vatApplicable !== undefined ? vatApplicable : true,
    feePeriod: feePeriod || 'quarterly',
    approvalStatus: approvalStatus || 'draft',
    // Proximity Dual-Rate Fee Fields (default from structure if not provided)
    feeRateOnNic: feeRateOnNic !== undefined ? feeRateOnNic : structure.feeRateOnNic || null,
    feeRateOnUnfunded: feeRateOnUnfunded !== undefined ? feeRateOnUnfunded : structure.feeRateOnUnfunded || null,
    createdBy: userId
  };

  const capitalCall = await CapitalCall.create(capitalCallData);

  // Optionally create allocations for all investors in structure
  let allocations = null;
  if (createAllocations === true) {
    allocations = await CapitalCall.createAllocationsForStructure(capitalCall.id, structureId);
  }

  res.status(201).json({
    success: true,
    message: 'Capital call created successfully',
    data: {
      capitalCall,
      allocations: allocations || []
    }
  });
}));

/**
 * @route   GET /api/capital-calls
 * @desc    Get all capital calls (role-based filtering applied)
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
  // Root (role 0) sees all capital calls, so no userId filter

  if (structureId) filter.structureId = structureId;
  if (status) filter.status = status;

  const capitalCalls = await CapitalCall.find(filter);

  res.status(200).json({
    success: true,
    count: capitalCalls.length,
    data: capitalCalls
  });
}));

/**
 * @route   GET /api/capital-calls/:id
 * @desc    Get a single capital call by ID
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);

  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  res.status(200).json({
    success: true,
    data: capitalCall
  });
}));

/**
 * @route   GET /api/capital-calls/:id/with-allocations
 * @desc    Get capital call with investor allocations
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/with-allocations', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const capitalCallWithAllocations = await CapitalCall.findWithAllocations(id);

  res.status(200).json({
    success: true,
    data: capitalCallWithAllocations
  });
}));

/**
 * @route   GET /api/capital-calls/structure/:structureId/summary
 * @desc    Get capital call summary for a structure
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

  const summary = await CapitalCall.getSummary(structureId);

  res.status(200).json({
    success: true,
    data: summary
  });
}));

/**
 * @route   GET /api/capital-calls/investor/:investorId
 * @desc    Get all capital calls for a specific investor
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/investor/:investorId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { investorId } = req.params;

  validate(investorId, 'Investor ID is required');

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  validate(uuidRegex.test(investorId), 'Invalid investor ID format');

  const capitalCalls = await CapitalCall.findByInvestorId(investorId);

  // Role-based filtering: Root sees all, Admin sees only their own
  const userCapitalCalls = userRole === ROLES.ROOT
    ? capitalCalls
    : capitalCalls.filter(call => call.createdBy === userId);

  res.status(200).json({
    success: true,
    count: userCapitalCalls.length,
    data: userCapitalCalls
  });
}));

/**
 * @route   PUT /api/capital-calls/:id
 * @desc    Update a capital call
 * @access  Private (requires authentication, Root/Admin only)
 */
router.put('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const updateData = {};
  const allowedFields = [
    'callDate', 'dueDate', 'totalCallAmount', 'purpose', 'notes', 'status',
    // ILPA Fee Configuration
    'managementFeeBase', 'managementFeeRate', 'vatRate', 'vatApplicable', 'feePeriod', 'approvalStatus',
    // Proximity Dual-Rate Fee Fields
    'feeRateOnNic', 'feeRateOnUnfunded'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  validate(Object.keys(updateData).length > 0, 'No valid fields provided for update');

  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Capital call updated successfully',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/send
 * @desc    Mark capital call as sent
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/send', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }
  validate(capitalCall.status === 'Draft', 'Capital call must be in Draft status to send');

  const updatedCapitalCall = await CapitalCall.markAsSent(id);

  res.status(200).json({
    success: true,
    message: 'Capital call marked as sent',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/mark-paid
 * @desc    Mark capital call as fully paid
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/mark-paid', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const updatedCapitalCall = await CapitalCall.markAsPaid(id);

  res.status(200).json({
    success: true,
    message: 'Capital call marked as paid',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/update-payment
 * @desc    Update payment amounts for capital call
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/update-payment', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { paidAmount } = req.body;

  validate(paidAmount !== undefined && paidAmount > 0, 'Paid amount must be positive');

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const updatedCapitalCall = await CapitalCall.updatePaymentAmounts(id, paidAmount);

  res.status(200).json({
    success: true,
    message: 'Payment amounts updated successfully',
    data: updatedCapitalCall
  });
}));

/**
 * @route   POST /api/capital-calls/:id/create-allocations
 * @desc    Create allocations for all investors in structure
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/:id/create-allocations', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const structure = await Structure.findById(capitalCall.structureId);
  validate(structure, 'Structure not found');

  const allocations = await CapitalCall.createAllocationsForStructure(id, capitalCall.structureId);

  res.status(201).json({
    success: true,
    message: 'Allocations created successfully',
    data: allocations
  });
}));

/**
 * @route   DELETE /api/capital-calls/:id
 * @desc    Delete a capital call
 * @access  Private (requires authentication, Root/Admin only)
 */
router.delete('/:id', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can delete any capital call, Admin can only delete their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  await CapitalCall.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Capital call deleted successfully'
  });
}));

/**
 * @route   GET /api/capital-calls/:id/generate-notice
 * @desc    Generate ILPA Capital Call Notice PDF
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/generate-notice', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const defaultFirmName = await getFirmNameForUser(userId);
  const { firmName = defaultFirmName } = req.query;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const structure = await Structure.findById(capitalCall.structureId);
  validate(structure, 'Structure not found');

  // Get allocations
  const capitalCallWithAllocations = await CapitalCall.findWithAllocations(id);

  // Generate PDF
  const pdfBuffer = await generateCapitalCallNoticePDF(
    { ...capitalCall, allocations: capitalCallWithAllocations?.capital_call_allocations || [] },
    structure,
    { firmName, bankDetails: structure.bankDetails }
  );

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ILPA_Capital_Call_${capitalCall.callNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}));

/**
 * @route   GET /api/capital-calls/:id/generate-lp-notice/:investorId
 * @desc    Generate Individual LP ILPA Notice PDF
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/generate-lp-notice/:investorId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id, investorId } = req.params;
  const defaultFirmName = await getFirmNameForUser(userId);
  const { firmName = defaultFirmName } = req.query;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const structure = await Structure.findById(capitalCall.structureId);
  validate(structure, 'Structure not found');

  // Get allocations
  const capitalCallWithAllocations = await CapitalCall.findWithAllocations(id);
  const allocations = capitalCallWithAllocations?.capital_call_allocations || [];

  // Find the specific investor's allocation
  const allocation = allocations.find(a => a.user_id === investorId);
  validate(allocation, 'Investor allocation not found');

  // Get investor details
  const investor = await User.findById(investorId);

  // Generate individual LP PDF
  const pdfBuffer = await generateIndividualLPNoticePDF(
    capitalCall,
    allocation,
    structure,
    investor,
    { firmName, bankDetails: structure.bankDetails }
  );

  const investorName = investor?.name || allocation.investorName || 'Investor';

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ILPA_Capital_Call_${capitalCall.callNumber}_${investorName.replace(/\s+/g, '_')}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}));

/**
 * @route   POST /api/capital-calls/:id/send-notices
 * @desc    Send ILPA Capital Call Notices to all investors via email
 * @access  Private (requires authentication, Root/Admin only)
 */
router.post('/:id/send-notices', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const defaultFirmName = await getFirmNameForUser(userId);
  const { firmName = defaultFirmName, subject, bodyText, bodyHtml } = req.body;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const structure = await Structure.findById(capitalCall.structureId);
  validate(structure, 'Structure not found');

  // Get allocations with investor details
  const capitalCallWithAllocations = await CapitalCall.findWithAllocations(id);
  const allocations = capitalCallWithAllocations?.capital_call_allocations || [];

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

      // Generate individual LP PDF
      const pdfBuffer = await generateIndividualLPNoticePDF(
        capitalCall,
        allocation,
        structure,
        investor,
        { firmName, bankDetails: structure.bankDetails }
      );

      // Prepare email content
      const defaultSubject = `Capital Call Notice #${capitalCall.callNumber} - ${structure.name}`;
      const defaultBodyText = `Dear ${investor.name},\n\nPlease find attached your Capital Call Notice #${capitalCall.callNumber} for ${structure.name}.\n\nPayment Due Date: ${new Date(capitalCall.dueDate).toLocaleDateString()}\n\nPlease review the attached notice for payment instructions.\n\nBest regards,\n${firmName}`;
      const defaultBodyHtml = `
        <p>Dear ${investor.name},</p>
        <p>Please find attached your Capital Call Notice #${capitalCall.callNumber} for <strong>${structure.name}</strong>.</p>
        <p><strong>Payment Due Date:</strong> ${new Date(capitalCall.dueDate).toLocaleDateString()}</p>
        <p>Please review the attached notice for payment instructions.</p>
        <p>Best regards,<br/>${firmName}</p>
      `;

      // Send email with PDF attachment
      await sendEmail(userId, {
        to: [investor.email],
        subject: subject || defaultSubject,
        bodyText: bodyText || defaultBodyText,
        bodyHtml: bodyHtml || defaultBodyHtml,
        attachments: [{
          filename: `ILPA_Capital_Call_${capitalCall.callNumber}_${investor.name.replace(/\s+/g, '_')}.pdf`,
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

  // Update capital call status if all notices were sent
  if (errors.length === 0 && results.length > 0) {
    await CapitalCall.markAsSent(id);
  }

  res.status(200).json({
    success: true,
    message: `Notices sent to ${results.length} investor(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    data: {
      sent: results,
      failed: errors,
      capitalCallStatus: errors.length === 0 ? 'Sent' : capitalCall.status
    }
  });
}));

// ==========================================
// APPROVAL WORKFLOW ENDPOINTS
// ==========================================

/**
 * @route   GET /api/capital-calls/:id/approval-history
 * @desc    Get approval history for a capital call
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/:id/approval-history', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can access any capital call, Admin can only access their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }

  const history = await ApprovalHistory.findByEntity('capital_call', id);

  res.status(200).json({
    success: true,
    data: history
  });
}));

/**
 * @route   GET /api/capital-calls/pending-approval
 * @desc    Get all capital calls pending approval
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

  const capitalCalls = await CapitalCall.findByApprovalStatus(filter);

  res.status(200).json({
    success: true,
    count: capitalCalls.length,
    data: capitalCalls
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/submit-for-review
 * @desc    Submit capital call for review (draft -> pending_review)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/submit-for-review', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can edit any capital call, Admin can only edit their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }
  validate(capitalCall.approvalStatus === 'draft', 'Capital call must be in draft status to submit for review');

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, {
    approvalStatus: 'pending_review'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'capital_call',
    entityId: id,
    action: 'submitted',
    fromStatus: 'draft',
    toStatus: 'pending_review',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { callNumber: capitalCall.callNumber }
  });

  // Send email notification to approvers (Root users)
  try {
    const rootUsers = await User.findByRole(0); // Root users are approvers
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(capitalCall.structureId);

    for (const approver of rootUsers) {
      if (approver?.email && approver.id !== userId) {
        await sendEmail(userId, {
          to: [approver.email],
          subject: `Action Required: Capital Call #${capitalCall.callNumber} Awaiting Approval - ${structure?.name || 'Fund'}`,
          bodyText: `Dear ${approver.name},\n\nA capital call has been submitted for your review.\n\nCapital Call #${capitalCall.callNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${capitalCall.totalCallAmount.toLocaleString()}\nSubmitted by: ${user?.name || 'Unknown'}\n\nPlease log in to review and approve.\n\nBest regards,\n${firmName}`,
          bodyHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #f39c12; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #856404;">Approval Required</h2>
              </div>
              <p>Dear ${approver.name},</p>
              <p>A capital call has been submitted for your review and approval.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Capital Call:</strong> #${capitalCall.callNumber}</p>
                <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${capitalCall.totalCallAmount.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${user?.name || 'Unknown'}</p>
              </div>
              <p>Please log in to the portal to review and approve this capital call.</p>
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
    message: 'Capital call submitted for review',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/approve
 * @desc    Approve capital call (pending_review -> pending_cfo or approved)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/approve', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes, requireCFO = true } = req.body;

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can approve any capital call, Admin can only approve their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }
  validate(
    capitalCall.approvalStatus === 'pending_review',
    'Capital call must be pending review to approve'
  );

  // Get user details for history
  const user = await User.findById(userId);

  // Determine next status
  const nextStatus = requireCFO ? 'pending_cfo' : 'approved';
  const action = requireCFO ? 'cfo_submitted' : 'approved';

  // Update approval status
  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, {
    approvalStatus: nextStatus
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'capital_call',
    entityId: id,
    action,
    fromStatus: 'pending_review',
    toStatus: nextStatus,
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { callNumber: capitalCall.callNumber, requireCFO }
  });

  // Send email notification
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(capitalCall.structureId);

    if (requireCFO) {
      // Notify CFO (Root users) that approval is needed
      const rootUsers = await User.findByRole(0);
      for (const cfo of rootUsers) {
        if (cfo?.email) {
          await sendEmail(userId, {
            to: [cfo.email],
            subject: `CFO Approval Required: Capital Call #${capitalCall.callNumber} - ${structure?.name || 'Fund'}`,
            bodyText: `Dear ${cfo.name},\n\nA capital call has been reviewed and approved by the operations team. It now requires your final approval.\n\nCapital Call #${capitalCall.callNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${capitalCall.totalCallAmount.toLocaleString()}\nApproved by: ${user?.name || 'Unknown'}\n\nPlease log in to provide final approval.\n\nBest regards,\n${firmName}`,
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin-bottom: 20px;">
                  <h2 style="margin: 0; color: #0c5460;">CFO Approval Required</h2>
                </div>
                <p>Dear ${cfo.name},</p>
                <p>A capital call has been reviewed and approved by the operations team. It now requires your final approval.</p>
                <div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 0; color: #155724;"><strong>Initial Approval:</strong> Approved by ${user?.name || 'Unknown'}</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Capital Call:</strong> #${capitalCall.callNumber}</p>
                  <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${capitalCall.totalCallAmount.toLocaleString()}</p>
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
      const creator = await User.findById(capitalCall.createdBy);
      if (creator?.email) {
        await sendEmail(userId, {
          to: [creator.email],
          subject: `Approved: Capital Call #${capitalCall.callNumber} - ${structure?.name || 'Fund'}`,
          bodyText: `Dear ${creator.name},\n\nGreat news! Your capital call has been approved.\n\nCapital Call #${capitalCall.callNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${capitalCall.totalCallAmount.toLocaleString()}\nApproved by: ${user?.name || 'Unknown'}\n\nYou can now proceed to send notices to investors.\n\nBest regards,\n${firmName}`,
          bodyHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #155724;">Capital Call Approved</h2>
              </div>
              <p>Dear ${creator.name},</p>
              <p>Great news! Your capital call has been approved and is ready for the next step.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Capital Call:</strong> #${capitalCall.callNumber}</p>
                <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${capitalCall.totalCallAmount.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Approved by:</strong> ${user?.name || 'Unknown'}</p>
              </div>
              <p><strong>Next Steps:</strong> You can now send capital call notices to investors.</p>
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
    message: requireCFO ? 'Capital call sent to CFO for approval' : 'Capital call approved',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/cfo-approve
 * @desc    CFO final approval (pending_cfo -> approved)
 * @access  Private (requires authentication, Root only - CFO)
 */
router.patch('/:id/cfo-approve', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  // Only Root (CFO) can do final approval
  validate(userRole === ROLES.ROOT, 'Only CFO can provide final approval');

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');
  validate(
    capitalCall.approvalStatus === 'pending_cfo',
    'Capital call must be pending CFO approval'
  );

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, {
    approvalStatus: 'approved'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'capital_call',
    entityId: id,
    action: 'cfo_approved',
    fromStatus: 'pending_cfo',
    toStatus: 'approved',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { callNumber: capitalCall.callNumber }
  });

  // Send email notification to submitter
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(capitalCall.structureId);
    const creator = await User.findById(capitalCall.createdBy);

    if (creator?.email) {
      await sendEmail(userId, {
        to: [creator.email],
        subject: `CFO Approved: Capital Call #${capitalCall.callNumber} - ${structure?.name || 'Fund'}`,
        bodyText: `Dear ${creator.name},\n\nGreat news! Your capital call has received final CFO approval.\n\nCapital Call #${capitalCall.callNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${capitalCall.totalCallAmount.toLocaleString()}\nCFO Approved by: ${user?.name || 'Unknown'}\n\nYou can now proceed to send notices to investors.\n\nBest regards,\n${firmName}`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #155724;">CFO Approval Confirmed</h2>
            </div>
            <p>Dear ${creator.name},</p>
            <p>Great news! Your capital call has received final CFO approval and is now ready to be sent to investors.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Capital Call:</strong> #${capitalCall.callNumber}</p>
              <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${capitalCall.totalCallAmount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>CFO Approved by:</strong> ${user?.name || 'Unknown'}</p>
            </div>
            <p><strong>Next Steps:</strong> You can now send capital call notices to all investors.</p>
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
    message: 'Capital call approved by CFO',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/reject
 * @desc    Reject capital call (any pending status -> rejected)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/reject', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { reason } = req.body;

  validate(reason?.trim(), 'Rejection reason is required');

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can reject any, Admin can only reject their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }
  validate(
    ['pending_review', 'pending_cfo'].includes(capitalCall.approvalStatus),
    'Capital call must be pending to reject'
  );

  // If pending CFO, only Root can reject
  if (capitalCall.approvalStatus === 'pending_cfo') {
    validate(userRole === ROLES.ROOT, 'Only CFO can reject at this stage');
  }

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status
  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, {
    approvalStatus: 'rejected'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'capital_call',
    entityId: id,
    action: 'rejected',
    fromStatus: capitalCall.approvalStatus,
    toStatus: 'rejected',
    userId,
    userName: user?.name || 'Unknown',
    notes: reason,
    metadata: { callNumber: capitalCall.callNumber }
  });

  // Send email notification to submitter
  try {
    const firmName = await getFirmNameForUser(userId);
    const structure = await Structure.findById(capitalCall.structureId);
    const creator = await User.findById(capitalCall.createdBy);

    if (creator?.email) {
      await sendEmail(userId, {
        to: [creator.email],
        subject: `Rejected: Capital Call #${capitalCall.callNumber} - ${structure?.name || 'Fund'}`,
        bodyText: `Dear ${creator.name},\n\nUnfortunately, your capital call has been rejected.\n\nCapital Call #${capitalCall.callNumber}\nFund: ${structure?.name || 'N/A'}\nAmount: $${capitalCall.totalCallAmount.toLocaleString()}\nRejected by: ${user?.name || 'Unknown'}\n\nReason for Rejection:\n${reason}\n\nPlease review the feedback and create a new capital call with the necessary corrections.\n\nBest regards,\n${firmName}`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #721c24;">Capital Call Rejected</h2>
            </div>
            <p>Dear ${creator.name},</p>
            <p>Unfortunately, your capital call has been rejected and cannot proceed at this time.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Capital Call:</strong> #${capitalCall.callNumber}</p>
              <p style="margin: 5px 0;"><strong>Fund:</strong> ${structure?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${capitalCall.totalCallAmount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Rejected by:</strong> ${user?.name || 'Unknown'}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Reason for Rejection</h4>
              <p style="margin: 0; color: #856404;">${reason}</p>
            </div>
            <p>Please review the feedback and create a new capital call with the necessary corrections.</p>
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
    message: 'Capital call rejected',
    data: updatedCapitalCall
  });
}));

/**
 * @route   PATCH /api/capital-calls/:id/request-changes
 * @desc    Request changes on capital call (pending -> draft)
 * @access  Private (requires authentication, Root/Admin only)
 */
router.patch('/:id/request-changes', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { id } = req.params;
  const { notes } = req.body;

  validate(notes?.trim(), 'Change request notes are required');

  const capitalCall = await CapitalCall.findById(id);
  validate(capitalCall, 'Capital call not found');

  // Root can request changes on any, Admin can only on their own
  if (userRole === ROLES.ADMIN) {
    validate(capitalCall.createdBy === userId, 'Unauthorized access to capital call');
  }
  validate(
    ['pending_review', 'pending_cfo'].includes(capitalCall.approvalStatus),
    'Capital call must be pending to request changes'
  );

  // If pending CFO, only Root can request changes
  if (capitalCall.approvalStatus === 'pending_cfo') {
    validate(userRole === ROLES.ROOT, 'Only CFO can request changes at this stage');
  }

  // Get user details for history
  const user = await User.findById(userId);

  // Update approval status back to draft
  const updatedCapitalCall = await CapitalCall.findByIdAndUpdate(id, {
    approvalStatus: 'draft'
  });

  // Log approval action
  await ApprovalHistory.logAction({
    entityType: 'capital_call',
    entityId: id,
    action: 'changes_requested',
    fromStatus: capitalCall.approvalStatus,
    toStatus: 'draft',
    userId,
    userName: user?.name || 'Unknown',
    notes,
    metadata: { callNumber: capitalCall.callNumber }
  });

  // Send email notification to creator about requested changes
  try {
    const creator = await User.findById(capitalCall.createdBy);
    if (creator?.email) {
      const firmName = await getFirmNameForUser(userId);
      await sendEmail(userId, {
        to: [creator.email],
        subject: `Changes Requested: Capital Call #${capitalCall.callNumber}`,
        bodyText: `Changes have been requested on Capital Call #${capitalCall.callNumber}.\n\nReviewer Notes:\n${notes}\n\nPlease review and resubmit.`,
        bodyHtml: `
          <p>Changes have been requested on <strong>Capital Call #${capitalCall.callNumber}</strong>.</p>
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
    message: 'Changes requested on capital call',
    data: updatedCapitalCall
  });
}));

/**
 * @route   GET /api/capital-calls/health
 * @desc    Health check for Capital Call API routes
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    service: 'Capital Call API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
