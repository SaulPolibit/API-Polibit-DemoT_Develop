---
title: "Reference: Connect Payouts"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Stripe Connect — Investor Payouts

## Overview

Stripe Connect Express accounts enable the platform to send payouts to investors. Fund managers (ADMIN/ROOT) can onboard investors and trigger transfers from the platform account to individual investor Connect accounts.

## Connect Flow

```
1. Investor creates Express account → POST /api/stripe/connect/accounts
2. Investor completes onboarding → Stripe-hosted form (onboarding link)
3. Admin verifies readiness → GET /api/stripe/connect/admin/investors/:id/status
4. Admin triggers transfer → platform creates Transfer to Connect account
5. Stripe auto-payouts → funds reach investor's bank account
```

## Service Methods

### Create Express Account
```javascript
async createConnectAccount(email, metadata = {}) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const account = await connectStripe.accounts.create({
    type: 'express',
    email,
    metadata,
    capabilities: {
      transfers: { requested: true },
    },
  });
  return account;
  // Store account.id as user.stripe_connect_account_id
}
```

### Generate Onboarding Link
```javascript
async createAccountOnboardingLink(accountId, returnUrl, refreshUrl) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const accountLink = await connectStripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return accountLink;  // { url, expires_at }
}
```

### Generate Dashboard Link
```javascript
async createDashboardLink(accountId) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const loginLink = await connectStripe.accounts.createLoginLink(accountId);
  return loginLink;  // { url }
}
```

### Create Transfer
```javascript
async createTransfer(connectAccountId, amount, currency, metadata = {}) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const transfer = await connectStripe.transfers.create({
    amount,          // in cents
    currency,        // 'usd'
    destination: connectAccountId,
    metadata,
  });
  return transfer;
}
```

### Get Account Balance
```javascript
async getAccountBalance(accountId) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const balance = await connectStripe.balance.retrieve({
    stripeAccount: accountId,
  });
  return balance;
}
```

## Connect Webhook Events (`POST /api/stripe/connect/webhook`)

| Event | Handler Action |
|-------|---------------|
| `account.updated` | Update account status in DB (charges_enabled, payouts_enabled) |
| `account.application.deauthorized` | Mark Connect account as disconnected |
| `transfer.created` | Log transfer record |
| `transfer.reversed` | Handle transfer reversal |
| `payout.paid` | Confirm payout reached investor's bank |
| `payout.failed` | Notify admin of failed payout |
| `capability.updated` | Update account capabilities status |

## Account Status Checks

```javascript
// Check if account is ready for payouts
async isAccountReady(accountId) {
  const connectStripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY);
  const account = await connectStripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  };
}
```

## Admin Routes

### List Investors with Connect Status
```javascript
// GET /api/stripe/connect/admin/investors
// Returns all investors with their Connect account status
// Requires: authenticate + requireInvestmentManagerAccess
// Response: [{ userId, email, connectAccountId, status, chargesEnabled, payoutsEnabled }]
```

### Send Onboarding Invite
```javascript
// POST /api/stripe/connect/admin/investors/:id/invite
// Creates Connect account if not exists, generates onboarding link
// Sends invite email to investor with onboarding URL
```

## Role Requirements

| Route Group | Required Role |
|-------------|--------------|
| Investor account creation/onboarding | INVESTOR (3) — own account only |
| Account dashboard/balance | INVESTOR (3) — own account only |
| Admin status/invite/list | ROOT (0), ADMIN (1), SUPPORT (2) |
| Webhook endpoints | Stripe signature verification (no JWT) |
