/**
 * Stripe Routes
 * Handles all Stripe subscription endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const stripeService = require('../services/stripe.service');
const { User } = require('../models/supabase');

// Price IDs from environment
const PRICE_IDS = {
  SERVICE_BASE_COST: process.env.STRIPE_SERVICE_BASE_COST_PRICE_ID,
  ADDITIONAL_SERVICE_COST: process.env.STRIPE_ADDITIONAL_SERVICE_COST_PRICE_ID
};

/**
 * GET /api/stripe/config
 * Get Stripe configuration for frontend
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    priceIds: PRICE_IDS,
    currency: 'usd'
  });
});

/**
 * POST /api/stripe/create-customer
 * Create a Stripe customer for the authenticated user
 */
router.post('/create-customer', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check if customer already exists
  if (user.stripeCustomerId) {
    return res.json({ success: true, customerId: user.stripeCustomerId });
  }

  // Create new customer
  const customer = await stripeService.createCustomer(user);

  // Update user with Stripe customer ID
  await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });

  res.json({ success: true, customerId: customer.id });
}));

/**
 * POST /api/stripe/create-subscription
 * Create a subscription for the authenticated user
 */
router.post('/create-subscription', authenticate, catchAsync(async (req, res) => {
  const { cardToken, additionalServiceQuantity = 0, trialDays } = req.body;
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!cardToken) {
    return res.status(400).json({ success: false, message: 'Card token is required' });
  }

  if (!user.stripeCustomerId) {
    return res.status(400).json({ success: false, message: 'Please create a customer first' });
  }

  // Create payment method from token and attach to customer
  const paymentMethod = await stripeService.createPaymentMethodFromToken(cardToken);
  await stripeService.attachPaymentMethodToCustomer(paymentMethod.id, user.stripeCustomerId);

  // Prepare addons
  const addons = [];
  if (additionalServiceQuantity > 0 && PRICE_IDS.ADDITIONAL_SERVICE_COST) {
    addons.push({
      priceId: PRICE_IDS.ADDITIONAL_SERVICE_COST,
      quantity: additionalServiceQuantity
    });
  }

  // Subscription options
  const options = { default_payment_method: paymentMethod.id };
  if (trialDays && trialDays > 0) {
    options.trial_period_days = trialDays;
  }

  // Create subscription
  const subscription = await stripeService.createSubscription(
    user.stripeCustomerId,
    PRICE_IDS.SERVICE_BASE_COST,
    addons,
    options
  );

  // Update user with subscription info
  await User.findByIdAndUpdate(userId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status
  });

  res.json({
    success: true,
    subscriptionId: subscription.id,
    status: subscription.status,
    message: subscription.status === 'active'
      ? 'Subscription created and payment successful!'
      : 'Subscription created'
  });
}));

/**
 * GET /api/stripe/subscription
 * Get the current user's subscription
 */
router.get('/subscription', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeSubscriptionId) {
    return res.json({ success: true, subscription: null });
  }

  const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
  res.json({ success: true, subscription });
}));

/**
 * POST /api/stripe/add-additional-service
 * Add an additional service to the current subscription
 */
router.post('/add-additional-service', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeSubscriptionId) {
    return res.status(400).json({ success: false, message: 'No active subscription found' });
  }

  if (!PRICE_IDS.ADDITIONAL_SERVICE_COST) {
    return res.status(500).json({ success: false, message: 'Additional service price not configured' });
  }

  const item = await stripeService.addAddonToSubscription(
    user.stripeSubscriptionId,
    PRICE_IDS.ADDITIONAL_SERVICE_COST
  );

  res.json({ success: true, subscriptionItem: item });
}));

/**
 * POST /api/stripe/update-service-quantity
 * Update the quantity of a service item
 */
router.post('/update-service-quantity', authenticate, catchAsync(async (req, res) => {
  const { subscriptionItemId, quantity } = req.body;

  if (!subscriptionItemId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'subscriptionItemId and quantity are required' });
  }

  const updated = await stripeService.updateSubscriptionItemQuantity(subscriptionItemId, quantity);
  res.json({ success: true, subscriptionItem: updated });
}));

/**
 * POST /api/stripe/remove-service
 * Remove a service item from the subscription
 */
router.post('/remove-service', authenticate, catchAsync(async (req, res) => {
  const { subscriptionItemId } = req.body;

  if (!subscriptionItemId) {
    return res.status(400).json({ success: false, message: 'subscriptionItemId is required' });
  }

  const deleted = await stripeService.removeAddonFromSubscription(subscriptionItemId);
  res.json({ success: true, deleted });
}));

/**
 * POST /api/stripe/cancel-subscription
 * Cancel the current subscription
 */
router.post('/cancel-subscription', authenticate, catchAsync(async (req, res) => {
  const { immediately = false } = req.body;
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeSubscriptionId) {
    return res.status(400).json({ success: false, message: 'No active subscription found' });
  }

  const subscription = await stripeService.cancelSubscription(user.stripeSubscriptionId, immediately);

  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: immediately ? 'canceled' : 'canceling'
  });

  res.json({ success: true, subscription });
}));

/**
 * POST /api/stripe/reactivate-subscription
 * Reactivate a subscription scheduled for cancellation
 */
router.post('/reactivate-subscription', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeSubscriptionId) {
    return res.status(400).json({ success: false, message: 'No subscription found' });
  }

  const subscription = await stripeService.reactivateSubscription(user.stripeSubscriptionId);

  await User.findByIdAndUpdate(userId, { subscriptionStatus: subscription.status });

  res.json({ success: true, subscription });
}));

/**
 * GET /api/stripe/invoices
 * Get invoices for the current user
 */
router.get('/invoices', authenticate, catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeCustomerId) {
    return res.json({ success: true, invoices: [] });
  }

  const invoices = await stripeService.getCustomerInvoices(user.stripeCustomerId, parseInt(limit));
  res.json({ success: true, invoices: invoices.data });
}));

/**
 * GET /api/stripe/upcoming-invoice
 * Get the upcoming invoice for the current user
 */
router.get('/upcoming-invoice', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const user = await User.findById(userId);

  if (!user || !user.stripeCustomerId) {
    return res.json({ success: true, upcomingInvoice: null });
  }

  const upcomingInvoice = await stripeService.getUpcomingInvoice(user.stripeCustomerId);
  res.json({ success: true, upcomingInvoice });
}));

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * Note: This needs raw body, so should be mounted before JSON parser
 */
router.post('/webhook', express.raw({ type: 'application/json' }), catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] Webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    event = stripeService.verifyWebhookSignature(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (user) {
        await User.findByIdAndUpdate(user.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        });
        console.log(`[Stripe Webhook] Updated subscription status for user ${user.id}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: deletedSub.customer });
      if (user) {
        await User.findByIdAndUpdate(user.id, { subscriptionStatus: 'canceled' });
        console.log(`[Stripe Webhook] Marked subscription as canceled for user ${user.id}`);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log(`[Stripe Webhook] Payment succeeded for invoice ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`[Stripe Webhook] Payment failed for invoice ${invoice.id}`);
      // Optionally update user subscription status
      const user = await User.findOne({ stripeCustomerId: invoice.customer });
      if (user) {
        await User.findByIdAndUpdate(user.id, { subscriptionStatus: 'past_due' });
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}));

module.exports = router;
