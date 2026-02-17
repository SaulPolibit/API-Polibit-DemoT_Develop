/**
 * Stripe Service
 * Handles all Stripe subscription and Connect operations
 */

// Stripe instance for Subscriptions (Fund Manager billing)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe instance for Connect (Investor payouts)
// Uses separate key if provided, otherwise falls back to main key
const stripeConnect = require('stripe')(
  process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_SECRET_KEY
);

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

  // ==========================================
  // STRIPE CONNECT METHODS (for Investors)
  // ==========================================

  /**
   * Create a Stripe Connect Express account for an investor
   * @param {Object} user - User object with email, firstName, lastName, country
   * @returns {Promise<Object>} Stripe Connect account object
   */
  async createConnectAccount(user) {
    try {
      const account = await stripeConnect.accounts.create({
        type: 'express',
        country: user.country || 'MX', // Default country
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        metadata: {
          userId: user.id,
          role: 'investor'
        }
      });

      console.log(`[Stripe Connect] Created account ${account.id} for user ${user.id}`);
      return account;
    } catch (error) {
      console.error('[Stripe Connect] Error creating account:', error);
      throw error;
    }
  }

  /**
   * Create account onboarding link
   * @param {string} accountId - Stripe Connect account ID
   * @param {string} refreshUrl - URL to redirect if link expires
   * @param {string} returnUrl - URL to redirect after onboarding
   * @returns {Promise<Object>} Account link object with URL
   */
  async createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
      const accountLink = await stripeConnect.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      console.log(`[Stripe Connect] Created onboarding link for account ${accountId}`);
      return accountLink;
    } catch (error) {
      console.error('[Stripe Connect] Error creating account link:', error);
      throw error;
    }
  }

  /**
   * Get Connect account details
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Promise<Object>} Account object
   */
  async getConnectAccount(accountId) {
    try {
      const account = await stripeConnect.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      console.error('[Stripe Connect] Error retrieving account:', error);
      throw error;
    }
  }

  /**
   * Check if Connect account has completed onboarding
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Promise<Object>} Onboarding status
   */
  async checkConnectAccountStatus(accountId) {
    try {
      const account = await stripeConnect.accounts.retrieve(accountId);

      const status = {
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
        isComplete: account.details_submitted && account.charges_enabled && account.payouts_enabled,
        accountStatus: this._determineAccountStatus(account)
      };

      console.log(`[Stripe Connect] Account ${accountId} status:`, status.accountStatus);
      return status;
    } catch (error) {
      console.error('[Stripe Connect] Error checking account status:', error);
      throw error;
    }
  }

  /**
   * Determine account status from Stripe account object
   * @param {Object} account - Stripe account object
   * @returns {string} Account status
   * @private
   */
  _determineAccountStatus(account) {
    if (!account.details_submitted) {
      return 'pending';
    }
    if (account.requirements?.disabled_reason) {
      return 'disabled';
    }
    if (account.requirements?.currently_due?.length > 0) {
      return 'pending';
    }
    if (account.charges_enabled && account.payouts_enabled) {
      return 'enabled';
    }
    return 'pending';
  }

  /**
   * Create a login link for the Connect Express dashboard
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Promise<Object>} Login link object
   */
  async createConnectDashboardLink(accountId) {
    try {
      const loginLink = await stripeConnect.accounts.createLoginLink(accountId);
      console.log(`[Stripe Connect] Created dashboard link for account ${accountId}`);
      return loginLink;
    } catch (error) {
      console.error('[Stripe Connect] Error creating dashboard link:', error);
      throw error;
    }
  }

  /**
   * Create a transfer to a Connect account (for distributions/payouts)
   * @param {string} accountId - Destination Stripe Connect account ID
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code (default: mxn)
   * @param {string} description - Transfer description
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Transfer object
   */
  async createTransferToConnectAccount(accountId, amount, currency = 'mxn', description = '', metadata = {}) {
    try {
      const transfer = await stripeConnect.transfers.create({
        amount: amount,
        currency: currency,
        destination: accountId,
        description: description,
        metadata: metadata
      });

      console.log(`[Stripe Connect] Created transfer ${transfer.id} to account ${accountId} for ${amount} ${currency}`);
      return transfer;
    } catch (error) {
      console.error('[Stripe Connect] Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Delete a Connect account
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteConnectAccount(accountId) {
    try {
      const deleted = await stripeConnect.accounts.del(accountId);
      console.log(`[Stripe Connect] Deleted account ${accountId}`);
      return deleted;
    } catch (error) {
      console.error('[Stripe Connect] Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Get Connect account balance
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Promise<Object>} Balance object
   */
  async getConnectAccountBalance(accountId) {
    try {
      const balance = await stripeConnect.balance.retrieve({
        stripeAccount: accountId
      });
      return balance;
    } catch (error) {
      console.error('[Stripe Connect] Error retrieving balance:', error);
      throw error;
    }
  }

  /**
   * Verify Connect webhook signature (uses separate secret)
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Parsed Stripe event
   */
  verifyConnectWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripeConnect.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('[Stripe Connect] Webhook signature verification failed:', error.message);
      throw error;
    }
  }
}

module.exports = new StripeService();
