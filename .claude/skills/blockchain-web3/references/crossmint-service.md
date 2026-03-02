---
title: "Reference: Crossmint Service"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Crossmint Service API

## Overview

Crossmint provides custodial wallet management for investors. The service (`src/services/crossmint.service.js`) is a singleton that handles wallet creation, token transfers, and NFT retrieval. It supports staging and production environments with different API base URLs.

## Service Initialization

```javascript
class CrossmintService {
  constructor() {
    this.apiKey = process.env.CROSSMINT_API_KEY;
    this.environment = process.env.CROSSMINT_ENVIRONMENT || 'staging';

    // Base URLs
    this.baseUrl = this.environment === 'production'
      ? 'https://www.crossmint.com/api'
      : 'https://staging.crossmint.com/api';

    // Validate API key on init
    if (!this.apiKey) {
      console.warn('CROSSMINT_API_KEY not set');
    }
  }
}

module.exports = new CrossmintService();
```

## Wallet Operations

### Create Wallet (Idempotent)
```javascript
async createWallet(userId, chain = 'polygon-amoy') {
  // POST /api/v1-alpha2/wallets
  const response = await axios.post(`${this.baseUrl}/v1-alpha2/wallets`, {
    type: 'custodial',
    linkedUser: `userId:${userId}`,
    chain,
  }, {
    headers: {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
  // Returns: { id, address, chain, type }
}
// NOTE: If wallet already exists, Crossmint returns 409 Conflict.
// Service handles this by fetching the existing wallet.
```

### Get Wallet
```javascript
async getWallet(walletId) {
  // GET /api/v1-alpha2/wallets/:walletId
  const response = await axios.get(
    `${this.baseUrl}/v1-alpha2/wallets/${walletId}`,
    { headers: { 'X-API-KEY': this.apiKey } }
  );
  return response.data;
}
```

### Get Wallet by User
```javascript
async getWalletByUser(userId, chain = 'polygon-amoy') {
  // GET /api/v1-alpha2/wallets?linkedUser=userId:{userId}&chain={chain}
  return response.data;
}
```

## Token Operations

### Get Token Balances
```javascript
async getTokenBalances(walletId) {
  // GET /api/v1-alpha2/wallets/:walletId/balances
  return response.data;
  // Returns: [{ token, balance, chain }]
}
```

### Transfer Tokens
```javascript
async transferTokens(fromWalletId, toAddress, tokenAddress, amount, chain = 'polygon-amoy') {
  // POST /api/v1-alpha2/wallets/:walletId/transfers
  const response = await axios.post(
    `${this.baseUrl}/v1-alpha2/wallets/${fromWalletId}/transfers`,
    {
      to: toAddress,
      token: tokenAddress,
      amount: amount.toString(),
      chain,
    },
    { headers: { 'X-API-KEY': this.apiKey } }
  );

  return response.data;
  // Returns: { id, status, transactionHash }
}
```

## NFT Operations

### Get NFTs
```javascript
async getNFTs(walletId) {
  // GET /api/v1-alpha2/wallets/:walletId/nfts
  return response.data;
  // Returns: [{ tokenId, contractAddress, metadata, chain }]
}
```

## Error Handling

```javascript
// Standard error wrapper
async _makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'X-API-KEY': this.apiKey, 'Content-Type': 'application/json' },
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // 409 Conflict — wallet already exists (idempotent)
    if (error.response?.status === 409) {
      console.log('Resource already exists, fetching existing...');
      return error.response.data;
    }
    throw error;
  }
}
```

## Chain Support

| Chain | Environment | Usage |
|-------|-------------|-------|
| `polygon-amoy` | Staging | Default for development/testing |
| `polygon` | Production | Mainnet operations |

## Portal HQ MPC Wallets (`src/services/apiManager.js`)

Portal HQ provides MPC (Multi-Party Computation) wallets as an alternative:

```javascript
// Create client
async createPortalClient(clientData) {
  // POST https://api.portalhq.io/api/v3/clients
}

// Generate wallet
async generatePortalWallet(clientId) {
  // POST https://api.portalhq.io/api/v3/clients/:clientId/wallets
}

// Get asset balances
async getPortalAssets(clientId) {
  // GET https://api.portalhq.io/api/v3/clients/:clientId/assets
}

// Get transaction history
async getPortalTransactions(clientId) {
  // GET https://api.portalhq.io/api/v3/clients/:clientId/transactions
}
```

### Portal HQ Constants
```javascript
PORTAL_HQ_BASE_URL: 'https://api.portalhq.io/api/v3'
PORTAL_HQ_VI_BASE_URL: 'https://mpc-client.portalhq.io/v1'
```
