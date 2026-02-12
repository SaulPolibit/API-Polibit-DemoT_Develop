/**
 * Stripe Service
 * Handles all Stripe subscription operations
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a new Stripe customer
   * @param {Object} user - User object with email, firstName, lastName
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(user) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      metadata: { userId: user.id }
    });
    console.log(`[Stripe] Created customer ${customer.id} for user ${user.id}`);
    return customer;
  }

  /**
   * Get an existing Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomer(customerId) {
    return await stripe.customers.retrieve(customerId);
  }

  /**
   * Create a payment method from a card token
   * @param {string} cardToken - Card token from Stripe.js
   * @returns {Promise<Object>} Payment method
   */
  async createPaymentMethodFromToken(cardToken) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: cardToken }
    });
    console.log(`[Stripe] Created payment method ${paymentMethod.id}`);
    return paymentMethod;
  }

  /**
   * Attach a payment method to a customer
   * @param {string} paymentMethodId - Payment method ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });
    console.log(`[Stripe] Attached payment method ${paymentMethodId} to customer ${customerId}`);
  }

  /**
   * Create a subscription
   * @param {string} customerId - Customer ID
   * @param {string} basePriceId - Base price ID
   * @param {Array} addons - Array of addon objects { priceId, quantity }
   * @param {Object} options - Additional subscription options
   * @returns {Promise<Object>} Subscription
   */
  async createSubscription(customerId, basePriceId, addons = [], options = {}) {
    const items = [{ price: basePriceId, quantity: 1 }];

    addons.forEach(addon => {
      if (addon.priceId && addon.quantity > 0) {
        items.push({ price: addon.priceId, quantity: addon.quantity });
      }
    });

    const subscriptionData = {
      customer: customerId,
      items: items,
      expand: ['latest_invoice.payment_intent'],
      ...options
    };

    if (!options.default_payment_method) {
      subscriptionData.payment_behavior = 'default_incomplete';
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log(`[Stripe] Created subscription ${subscription.id} for customer ${customerId}`);
    return subscription;
  }

  /**
   * Get a subscription with expanded data
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription
   */
  async getSubscription(subscriptionId) {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product', 'latest_invoice', 'customer']
    });
  }

  /**
   * Add an addon to an existing subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} addonPriceId - Addon price ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated subscription item
   */
  async addAddonToSubscription(subscriptionId, addonPriceId, quantity = 1) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    const existingItem = subscription.items.data.find(
      item => item.price.id === addonPriceId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      return await stripe.subscriptionItems.update(existingItem.id, {
        quantity: newQuantity,
        proration_behavior: 'create_prorations'
      });
    }

    return await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: addonPriceId,
      quantity: quantity,
      proration_behavior: 'create_prorations'
    });
  }

  /**
   * Update subscription item quantity
   * @param {string} subscriptionItemId - Subscription item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated subscription item
   */
  async updateSubscriptionItemQuantity(subscriptionItemId, quantity) {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    return await stripe.subscriptionItems.update(subscriptionItemId, {
      quantity: quantity,
      proration_behavior: 'create_prorations'
    });
  }

  /**
   * Remove an addon from a subscription
   * @param {string} subscriptionItemId - Subscription item ID
   * @returns {Promise<Object>} Deleted subscription item
   */
  async removeAddonFromSubscription(subscriptionItemId) {
    return await stripe.subscriptionItems.del(subscriptionItemId, {
      proration_behavior: 'create_prorations'
    });
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} immediately - Cancel immediately or at period end
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }

  /**
   * Reactivate a subscription scheduled for cancellation
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async reactivateSubscription(subscriptionId) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  }

  /**
   * Get customer invoices
   * @param {string} customerId - Customer ID
   * @param {number} limit - Number of invoices to retrieve
   * @returns {Promise<Object>} Invoices list
   */
  async getCustomerInvoices(customerId, limit = 10) {
    return await stripe.invoices.list({ customer: customerId, limit });
  }

  /**
   * Get upcoming invoice for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Upcoming invoice
   */
  async getUpcomingInvoice(customerId) {
    try {
      return await stripe.invoices.retrieveUpcoming({ customer: customerId });
    } catch (error) {
      // No upcoming invoice (e.g., no active subscription)
      if (error.code === 'invoice_upcoming_none') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {Buffer} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @param {string} webhookSecret - Webhook secret
   * @returns {Object} Verified event
   */
  verifyWebhookSignature(payload, signature, webhookSecret) {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get Stripe configuration for frontend
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      priceIds: {
        SERVICE_BASE_COST: process.env.STRIPE_SERVICE_BASE_COST_PRICE_ID,
        ADDITIONAL_SERVICE_COST: process.env.STRIPE_ADDITIONAL_SERVICE_COST_PRICE_ID
      },
      currency: 'usd'
    };
  }
}

module.exports = new StripeService();
