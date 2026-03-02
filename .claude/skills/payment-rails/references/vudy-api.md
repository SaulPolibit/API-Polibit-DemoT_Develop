---
title: "Reference: Vudy Payment Request Flow"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Vudy Payment Request Flow

## Overview

Vudy provides payment request creation and tracking for on-ramp operations. All Vudy methods are in `src/services/apiManager.js`.

## Base URL

```javascript
// From src/config/constants.js
VUDY_BASE_URL: 'https://vudy.tech/api/v1'
```

## Authentication

All Vudy API calls use the `x-api-key` header:

```javascript
const headers = {
  'x-api-key': process.env.VUDY_API_KEY,
  'Content-Type': 'application/json',
};
```

## API Methods

### Create Payment Request
```javascript
async createVudyRequest(requestData) {
  // POST https://vudy.tech/api/v1/requests
  const response = await axios.post(
    `${VUDY_BASE_URL}/requests`,
    {
      amount: requestData.amount,
      currency: requestData.currency || 'USD',
      description: requestData.description,
      callback_url: requestData.callbackUrl,
      external_id: requestData.externalId,
      // Additional fields as needed
    },
    { headers: { 'x-api-key': process.env.VUDY_API_KEY } }
  );
  return response.data;
  // Returns: { id, amount, currency, status, payment_url, ... }
}
```

### Get Payment Request Status
```javascript
async getVudyRequest(requestId) {
  // GET https://vudy.tech/api/v1/requests/:requestId
  const response = await axios.get(
    `${VUDY_BASE_URL}/requests/${requestId}`,
    { headers: { 'x-api-key': process.env.VUDY_API_KEY } }
  );
  return response.data;
  // Returns: { id, amount, currency, status, payment_url, created_at, ... }
  // status: 'pending' | 'completed' | 'expired' | 'cancelled'
}
```

### List Payment Requests (Batch)
```javascript
async listVudyRequests(params = {}) {
  // GET https://vudy.tech/api/v1/requests
  const response = await axios.get(
    `${VUDY_BASE_URL}/requests`,
    {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status,
      },
      headers: { 'x-api-key': process.env.VUDY_API_KEY },
    }
  );
  return response.data;
}
```

## Route Handlers (`src/routes/vudy.routes.js`)

```javascript
const { authenticate } = require('../middleware/auth');
const apiManager = require('../services/apiManager');

// Create payment request
router.post('/requests', authenticate, async (req, res) => {
  try {
    const request = await apiManager.createVudyRequest(req.body);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get payment request status
router.get('/requests/:id', authenticate, async (req, res) => {
  try {
    const request = await apiManager.getVudyRequest(req.params.id);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

// List payment requests
router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await apiManager.listVudyRequests(req.query);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});
```

## Payment Request Flow

```
1. Create payment request → POST /api/vudy/requests
   └── Vudy returns payment_url and request ID

2. Share payment_url with payer
   └── Payer completes payment via Vudy's hosted page

3. Poll status or receive callback
   └── GET /api/vudy/requests/:id → check status
   └── Or Vudy calls callback_url when completed

4. Status transitions:
   pending → completed (payment received)
   pending → expired (time limit reached)
   pending → cancelled (manually cancelled)
```

## Error Handling

```javascript
// Common Vudy errors:
// 401 → Invalid API key
// 400 → Invalid request body (missing required fields)
// 404 → Payment request not found
// 429 → Rate limit exceeded

try {
  const result = await apiManager.createVudyRequest(data);
} catch (error) {
  if (error.response?.status === 401) {
    throw new Error('Invalid Vudy API key');
  }
  if (error.response?.status === 400) {
    throw new Error(`Vudy validation error: ${error.response.data.message}`);
  }
  throw error;
}
```

## Constants Reference

```javascript
// From src/config/constants.js
module.exports = {
  VUDY_BASE_URL: 'https://vudy.tech/api/v1',
  // Vudy API key from environment
  // VUDY_API_KEY (also aliased as VudyAPIKey in .env.example)
};
```
