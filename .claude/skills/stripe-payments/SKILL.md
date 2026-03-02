---
name: stripe-payments
description: "Activate when working with Stripe subscriptions, payments, invoices, Connect accounts, payouts, or webhooks. Trigger phrases: 'Stripe', 'subscription', 'payment', 'invoice', 'payout', 'Connect', 'webhook stripe'. NOT for Bridge/Vudy payment rails (use payment-rails) or general billing logic."
---

# Stripe Payments — Subscriptions & Connect Payouts

## Purpose

This skill covers the Stripe integration which operates across two separate Stripe accounts: the **Main account** for fund manager subscriptions (SaaS billing) and the **Connect account** for investor payouts (Express accounts). Includes webhook handling for both accounts.

## Architecture

```
src/services/stripe.service.js    → Core Stripe logic (subscriptions + Connect)
src/routes/stripe.routes.js       → 28+ routes (subscriptions, Connect, webhooks)
src/models/supabase/subscription.js → Subscription state tracking in DB
src/models/supabase/user.js        → stripe_customer_id, stripe_connect_account_id
```

**Two Stripe Accounts:**
1. **Main** (`STRIPE_SECRET_KEY`) — Fund manager SaaS subscriptions
2. **Connect** (`STRIPE_CONNECT_SECRET_KEY`) — Investor payouts via Express accounts

## Key Files

| File | Purpose |
|------|---------|
| `src/services/stripe.service.js` | 472 lines — `createSubscription`, `cancelSubscription`, `reactivateSubscription`, `createConnectAccount`, `createTransfer`, `verifyWebhookSignature` |
| `src/routes/stripe.routes.js` | 917 lines — All subscription, Connect, and webhook endpoints |
| `src/models/supabase/subscription.js` | Subscription DB model |
| `src/models/supabase/payment.js` | Payment records |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Main Stripe secret key (subscriptions) |
| `STRIPE_PUBLISHABLE_KEY` | Main Stripe publishable key (frontend config) |
| `STRIPE_WEBHOOK_SECRET` | Main webhook signing secret (`whsec_...`) |
| `STRIPE_BASE_SERVICE_PRICE_ID` | Price ID for base subscription plan |
| `STRIPE_ADDITIONAL_SERVICE_BASE_PRICE_ID` | Price ID for additional services |
| `STRIPE_CONNECT_SECRET_KEY` | Connect secret key (investor payouts) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connect webhook signing secret |

## API Endpoints

### Subscription Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stripe/config` | Bearer | Get publishable key for frontend |
| POST | `/api/stripe/customers` | Bearer | Create Stripe customer |
| POST | `/api/stripe/subscriptions` | Bearer | Create subscription |
| GET | `/api/stripe/subscriptions/:id` | Bearer | Get subscription details |
| PUT | `/api/stripe/subscriptions/:id` | Bearer | Update subscription |
| POST | `/api/stripe/subscriptions/:id/cancel` | Bearer | Cancel subscription |
| POST | `/api/stripe/subscriptions/:id/reactivate` | Bearer | Reactivate cancelled subscription |
| POST | `/api/stripe/subscriptions/:id/services/add` | Bearer | Add service to subscription |
| PUT | `/api/stripe/subscriptions/:id/services/quantity` | Bearer | Update service quantity |
| DELETE | `/api/stripe/subscriptions/:id/services/remove` | Bearer | Remove service |
| GET | `/api/stripe/invoices/current` | Bearer | Get current invoice |
| GET | `/api/stripe/invoices/upcoming` | Bearer | Preview upcoming invoice |

### Connect (Investor Payouts)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/stripe/connect/accounts` | Bearer | Investor (3) | Create Express account |
| POST | `/api/stripe/connect/accounts/:id/onboarding` | Bearer | Investor (3) | Get onboarding link |
| GET | `/api/stripe/connect/accounts/:id/dashboard` | Bearer | Investor (3) | Get dashboard link |
| GET | `/api/stripe/connect/accounts/:id/balance` | Bearer | Investor (3) | Get account balance |
| GET | `/api/stripe/connect/admin/investors/:id/status` | Bearer | Admin (1,2) | Check investor Connect status |
| POST | `/api/stripe/connect/admin/investors/:id/invite` | Bearer | Admin (1,2) | Send onboarding invite |
| GET | `/api/stripe/connect/admin/investors` | Bearer | Admin (1,2) | List all investors with status |

### Webhooks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/stripe/webhook` | Stripe signature | Main subscription webhooks |
| POST | `/api/stripe/connect/webhook` | Stripe signature | Connect account webhooks |

## Common Tasks

### Create a subscription
```javascript
const stripeService = require('../services/stripe.service');
const subscription = await stripeService.createSubscription(customerId, priceId, {
  paymentMethodId,
  metadata: { userId, structureId },
});
```

### Process a payout to investor
```javascript
// 1. Ensure investor has Connect account
// 2. Create transfer from platform to Connect account
const transfer = await stripeService.createTransfer(
  connectAccountId, amount, currency, { distributionId }
);
```

### Verify webhook signature
```javascript
const event = stripeService.verifyWebhookSignature(
  req.body,          // raw body
  req.headers['stripe-signature'],
  webhookSecret
);
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Webhook signature failed | Raw body not preserved | Ensure `express.raw()` middleware before webhook routes |
| Connect account not ready | Onboarding incomplete | Check `account.charges_enabled` and `account.payouts_enabled` |
| Subscription creation fails | Missing payment method | Attach payment method to customer first |
| Invoice not generated | Subscription in trial | Check subscription status and trial end date |

## References

- [Subscription Lifecycle](references/subscription-lifecycle.md)
- [Connect Payouts](references/connect-payouts.md)
