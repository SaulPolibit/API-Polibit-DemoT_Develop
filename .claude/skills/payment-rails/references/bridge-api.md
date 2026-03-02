---
title: "Reference: Bridge API Operations"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Bridge API Operations

## Overview

Bridge provides fiat-to-crypto rails enabling wire transfers, virtual accounts, and crypto off-ramps. All Bridge methods are in `src/services/apiManager.js`.

## Base URLs

```javascript
// From src/config/constants.js
BRIDGE_BASE_URL: 'https://api.bridge.xyz'
BRIDGE_SANDBOX_BASE_URL: 'https://api.sandbox.bridge.xyz'
```

The environment (production vs sandbox) is determined by the API key or a configuration flag.

## Authentication

All Bridge API calls use the `Api-Key` header:

```javascript
const headers = {
  'Api-Key': process.env.BRIDGE_API_KEY,
  'Content-Type': 'application/json',
};
```

## Customer Management

### Create Customer
```javascript
async createBridgeCustomer(customerData) {
  // POST /v0/customers
  const response = await axios.post(
    `${BRIDGE_BASE_URL}/v0/customers`,
    {
      type: customerData.type,           // 'individual' | 'business'
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      email: customerData.email,
      // Additional KYC fields as needed
    },
    { headers }
  );
  return response.data;
  // Returns: { id, type, first_name, last_name, email, status }
}
```

### Get Customer
```javascript
async getBridgeCustomer(customerId) {
  // GET /v0/customers/:customerId
  const response = await axios.get(
    `${BRIDGE_BASE_URL}/v0/customers/${customerId}`,
    { headers }
  );
  return response.data;
}
```

## Wallet Management

### Create Wallet
```javascript
async createBridgeWallet(walletData) {
  // POST /v0/wallets
  const response = await axios.post(
    `${BRIDGE_BASE_URL}/v0/wallets`,
    {
      customer_id: walletData.customerId,
      chain: walletData.chain || 'polygon',
      currency: walletData.currency || 'usdc',
    },
    { headers }
  );
  return response.data;
  // Returns: { id, address, chain, currency, customer_id }
}
```

### Get Wallet
```javascript
async getBridgeWallet(walletId) {
  // GET /v0/wallets/:walletId
  return response.data;
}
```

## Virtual Accounts

Virtual accounts provide bank details for receiving wire transfers.

### Create Virtual Account
```javascript
async createBridgeVirtualAccount(accountData) {
  // POST /v0/virtual_accounts
  const response = await axios.post(
    `${BRIDGE_BASE_URL}/v0/virtual_accounts`,
    {
      customer_id: accountData.customerId,
      currency: accountData.currency || 'usd',
      // Returns routing number, account number, etc.
    },
    { headers }
  );
  return response.data;
  // Returns: {
  //   id, customer_id, currency, status,
  //   bank_details: { routing_number, account_number, bank_name }
  // }
}
```

### Get Virtual Account
```javascript
async getBridgeVirtualAccount(accountId) {
  // GET /v0/virtual_accounts/:accountId
  return response.data;
}
```

## Transfers

### Create Transfer
```javascript
async createBridgeTransfer(transferData) {
  // POST /v0/transfers
  const response = await axios.post(
    `${BRIDGE_BASE_URL}/v0/transfers`,
    {
      amount: transferData.amount,
      currency: transferData.currency,
      source: {
        type: transferData.sourceType,     // 'virtual_account' | 'wallet'
        id: transferData.sourceId,
      },
      destination: {
        type: transferData.destType,       // 'wallet' | 'bank_account'
        id: transferData.destId,
      },
      // Optional: on_behalf_of, external_id
    },
    { headers }
  );
  return response.data;
  // Returns: { id, amount, currency, status, source, destination }
}
```

### Get Transfer
```javascript
async getBridgeTransfer(transferId) {
  // GET /v0/transfers/:transferId
  return response.data;
  // status: 'pending' | 'processing' | 'completed' | 'failed'
}
```

## Route Handlers (`src/routes/bridge.routes.js`)

```javascript
const { authenticate } = require('../middleware/auth');
const apiManager = require('../services/apiManager');

// Create customer
router.post('/customers', authenticate, async (req, res) => {
  const customer = await apiManager.createBridgeCustomer(req.body);
  res.json({ success: true, data: customer });
});

// Create virtual account
router.post('/virtual-accounts', authenticate, async (req, res) => {
  const account = await apiManager.createBridgeVirtualAccount(req.body);
  res.json({ success: true, data: account });
});

// Create transfer
router.post('/transfers', authenticate, async (req, res) => {
  const transfer = await apiManager.createBridgeTransfer(req.body);
  res.json({ success: true, data: transfer });
});
```

## Transfer Flow

```
1. Create Customer (KYC/KYB)
   └── Returns customer_id

2. Create Virtual Account (for receiving wire)
   └── Returns bank_details (routing, account number)

3. Investor sends wire to virtual account
   └── Bridge processes incoming wire

4. Create Transfer (fiat → crypto)
   └── From virtual_account → wallet
   └── Converts USD → USDC and deposits to wallet

5. Monitor transfer status
   └── pending → processing → completed
```
