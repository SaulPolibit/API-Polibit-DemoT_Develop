---
title: "Reference: Subscription Lifecycle"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Subscription Lifecycle

## States

```
create → active → [cancel] → canceled
                → [past_due] → [payment retry] → active
                                               → canceled
active → [reactivate from cancel_at_period_end]
```

## Service Methods (`src/services/stripe.service.js`)

### Create Subscription
```javascript
async createSubscription(customerId, priceId, options = {}) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: options.metadata,
  });
  return subscription;
}
```

### Get Subscription
```javascript
async getSubscription(subscriptionId) {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'latest_invoice'],
  });
}
```

### Update Subscription
```javascript
async updateSubscription(subscriptionId, updates) {
  return await stripe.subscriptions.update(subscriptionId, updates);
}
```

### Cancel Subscription
```javascript
async cancelSubscription(subscriptionId, immediately = false) {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  // Cancel at period end (keeps active until billing period ends)
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
```

### Reactivate Subscription
```javascript
async reactivateSubscription(subscriptionId) {
  // Remove cancel_at_period_end flag
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
```

### Service Add-ons
```javascript
// Add service to existing subscription
async addService(subscriptionId, priceId, quantity = 1) {
  return await stripe.subscriptionItems.create({
    subscription: subscriptionId,
    price: priceId,
    quantity,
  });
}

// Update service quantity
async updateServiceQuantity(subscriptionItemId, quantity) {
  return await stripe.subscriptionItems.update(subscriptionItemId, { quantity });
}

// Remove service
async removeService(subscriptionItemId) {
  return await stripe.subscriptionItems.del(subscriptionItemId);
}
```

## Webhook Events Handled

### Main Subscription Webhooks (`POST /api/stripe/webhook`)

| Event | Handler Action |
|-------|---------------|
| `customer.subscription.created` | Create/update subscription record in DB |
| `customer.subscription.updated` | Update subscription status in DB |
| `customer.subscription.deleted` | Mark subscription as canceled in DB |
| `invoice.payment_succeeded` | Update payment record, activate subscription |
| `invoice.payment_failed` | Mark subscription as past_due, notify user |
| `invoice.created` | Log invoice creation |
| `invoice.finalized` | Log invoice finalization |

### Webhook Signature Verification
```javascript
// Route setup with raw body parser (critical!)
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // ... handle event
  }
);
```

## Customer Management

```javascript
// Create customer
async createCustomer(email, name, metadata = {}) {
  return await stripe.customers.create({ email, name, metadata });
}

// Retrieve customer
async getCustomer(customerId) {
  return await stripe.customers.retrieve(customerId);
}

// Update default payment method
async updateDefaultPaymentMethod(customerId, paymentMethodId) {
  return await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}
```

## Price IDs

| Variable | Purpose |
|----------|---------|
| `STRIPE_BASE_SERVICE_PRICE_ID` | Base subscription plan (recurring) |
| `STRIPE_ADDITIONAL_SERVICE_BASE_PRICE_ID` | Per-unit add-on pricing |
