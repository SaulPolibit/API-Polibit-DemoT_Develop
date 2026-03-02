---
name: payment-rails
description: "Activate when working with Bridge fiat-to-crypto rails, Vudy payment requests, virtual accounts, wire transfers, or on-ramp/off-ramp operations. Trigger phrases: 'Bridge', 'Vudy', 'fiat', 'wire transfer', 'virtual account', 'on-ramp', 'payment request', 'rails'. NOT for Stripe payments (use stripe-payments) or blockchain token transfers (use blockchain-web3)."
---

# Payment Rails — Bridge Fiat Rails & Vudy On-Ramp

## Purpose

This skill covers two fiat payment integrations: **Bridge** for fiat-to-crypto rails (customer management, wallets, virtual accounts, transfers) and **Vudy** for payment request creation and status tracking. Both are accessed through the centralized `apiManager.js`.

## Architecture

```
src/services/apiManager.js      → Bridge + Vudy API methods (within larger file)
src/services/httpClient.js      → HTTP client wrapper used by apiManager
src/routes/bridge.routes.js     → Bridge API route handlers (10KB)
src/routes/vudy.routes.js       → Vudy API route handlers (8KB)
src/config/constants.js         → Base URLs for Bridge and Vudy
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/apiManager.js` | Bridge methods (customers, wallets, virtual accounts, transfers) + Vudy methods (payment requests, status) |
| `src/routes/bridge.routes.js` | Bridge route handlers |
| `src/routes/vudy.routes.js` | Vudy route handlers |
| `src/config/constants.js` | `BRIDGE_BASE_URL`, `BRIDGE_SANDBOX_BASE_URL`, `VUDY_BASE_URL` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BRIDGE_API_KEY` | Bridge API key |
| `VUDY_API_KEY` | Vudy API key |

## API Endpoints

### Bridge Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/bridge/customers` | Bearer | Create Bridge customer |
| GET | `/api/bridge/customers/:id` | Bearer | Get customer details |
| POST | `/api/bridge/wallets` | Bearer | Create wallet |
| GET | `/api/bridge/wallets/:id` | Bearer | Get wallet details |
| POST | `/api/bridge/virtual-accounts` | Bearer | Create virtual account |
| GET | `/api/bridge/virtual-accounts/:id` | Bearer | Get virtual account details |
| POST | `/api/bridge/transfers` | Bearer | Create transfer |
| GET | `/api/bridge/transfers/:id` | Bearer | Get transfer status |

### Vudy Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/vudy/requests` | Bearer | Create payment request |
| GET | `/api/vudy/requests/:id` | Bearer | Get payment request status |
| GET | `/api/vudy/requests` | Bearer | List payment requests |

## Common Tasks

### Create a Bridge customer
```javascript
const apiManager = require('../services/apiManager');
const customer = await apiManager.createBridgeCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  type: 'individual',
});
```

### Create a Bridge virtual account
```javascript
const virtualAccount = await apiManager.createBridgeVirtualAccount({
  customerId,
  currency: 'usd',
  // Returns bank details for wire deposits
});
```

### Create a Vudy payment request
```javascript
const request = await apiManager.createVudyRequest({
  amount: 10000,
  currency: 'USD',
  description: 'Capital call payment',
  callbackUrl: 'https://api.example.com/webhook/vudy',
});
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Bridge 401 | Invalid API key | Check `BRIDGE_API_KEY` env var |
| Bridge sandbox vs production | Wrong base URL | Sandbox: `api.sandbox.bridge.xyz`, Prod: `api.bridge.xyz` |
| Vudy request fails | Invalid API key or payload | Check `VUDY_API_KEY` and request body format |
| Transfer stuck in pending | Processing delay on Bridge side | Check Bridge dashboard for transfer status |

## References

- [Bridge API Operations](references/bridge-api.md)
- [Vudy Payment Request Flow](references/vudy-api.md)
