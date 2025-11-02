const express = require('express');
const apiManager = require('../services/apiManager');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ===== WALLETS =====

// Get all wallets
router.get('/wallets', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.getAllWallets(context, req.query);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get wallet history
router.get('/wallets/:walletId/history', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, walletID: req.params.walletId };
    const result = await apiManager.getTransactionHistoryForAWallet(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// ===== CUSTOMERS =====

// Get all customers
router.get('/customers', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.getAllCustomers(context, req.query);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get single customer
router.get('/customers/:customerId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.getSingleCustomer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Delete customer
router.delete('/customers/:customerId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { customerID: req.params.customerId, ...req.body };
    const result = await apiManager.deleteSingleCustomer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Create short customer (KYC link)
router.post('/customers/kyc-link', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.createAShortCustomer(context, req.body);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Create full customer
router.post('/customers', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.createAFullCustomer(context, req.body);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get ToS acceptance URL
router.get('/customers/:customerId/tos-link', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.retrieveURLForToSAcceptance(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get KYC URL
router.get('/customers/:customerId/kyc-link', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.retrieveCustomerKYCURL(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get customer transfers
router.get('/customers/:customerId/transfers', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.getUserTransfers(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get specific wallet for customer
router.get('/customers/:customerId/wallets/:walletId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { 
      ...req.query, 
      customerID: req.params.customerId,
      walletID: req.params.walletId 
    };
    const result = await apiManager.getABridgeWallet(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get all wallets for customer
router.get('/customers/:customerId/wallets', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.getAllBridgeWalletsForACustomer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Create wallet for customer
router.post('/customers/:customerId/wallets', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.body, customerID: req.params.customerId };
    const result = await apiManager.createABridgeWallet(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// ===== VIRTUAL ACCOUNTS =====

// List virtual accounts
router.get('/customers/:customerId/ ', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, customerID: req.params.customerId };
    const result = await apiManager.listUserVirtualAccounts(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Create virtual account
router.post('/customers/:customerId/virtual-accounts', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.body, customerID: req.params.customerId };
    const result = await apiManager.createUserVirtualAccounts(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Update virtual account
router.put('/customers/:customerId/virtual-accounts/:accountId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { 
      ...req.body, 
      customerID: req.params.customerId,
      virtualAccountID: req.params.accountId 
    };
    const result = await apiManager.updateUserVirtualAccount(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Deactivate virtual account
router.post('/customers/:customerId/virtual-accounts/:accountId/deactivate', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { 
      ...req.body, 
      customerID: req.params.customerId,
      virtualAccountID: req.params.accountId 
    };
    const result = await apiManager.deactivateUserVirtualAccount(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Reactivate virtual account
router.post('/customers/:customerId/virtual-accounts/:accountId/reactivate', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { 
      ...req.body, 
      customerID: req.params.customerId,
      virtualAccountID: req.params.accountId 
    };
    const result = await apiManager.reactivateUserVirtualAccount(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});
// ===== TRANSFERS =====

// Get all transfers
router.get('/transfers', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.getAllTransfers(context, req.query);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Get single transfer
router.get('/transfers/:transferId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.query, transferID: req.params.transferId };
    const result = await apiManager.getSingleTransfer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Create transfer
router.post('/transfers', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const result = await apiManager.createATransfer(context, req.body);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Update transfer
router.put('/transfers/:transferId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { ...req.body, transferID: req.params.transferId };
    const result = await apiManager.updateATransfer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

// Delete transfer
router.delete('/transfers/:transferId', authenticate, async (req, res, next) => {
  try {
    const context = { auth: req.auth };
    const variables = { transferID: req.params.transferId, ...req.body };
    const result = await apiManager.deleteATransfer(context, variables);
    res.status(result.statusCode).json(result.body || { error: result.error });
  } catch (error) {
    next(error);
  }
});

module.exports = router;