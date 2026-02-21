/**
 * Notification Model for Supabase
 * Handles all notification operations
 */

const { getSupabase } = require('../../config/database');

const TABLE_NAME = 'notifications';

// Notification types
const NOTIFICATION_TYPES = [
  'capital_call_notice',
  'distribution_notice',
  'quarterly_report',
  'k1_tax_form',
  'document_upload',
  'general_announcement',
  'urgent_capital_call',
  'payment_confirmation',
  'security_alert',
  'investor_activity',
  'system_update',
  'mfa_enabled',
  'mfa_disabled',
  'profile_updated',
  'stripe_onboarding',
  'stripe_payout',
  'approval_required',
  'approval_completed',
  'new_investment',
  'investment_update'
];

// Notification channels
const NOTIFICATION_CHANNELS = ['email', 'sms', 'portal'];

// Notification statuses
const NOTIFICATION_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'];

// Notification priorities
const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

/**
 * Convert camelCase to snake_case for database fields
 */
const _toDbFields = (data) => {
  const fieldMap = {
    userId: 'user_id',
    notificationType: 'notification_type',
    channel: 'channel',
    title: 'title',
    message: 'message',
    status: 'status',
    priority: 'priority',
    relatedEntityType: 'related_entity_type',
    relatedEntityId: 'related_entity_id',
    metadata: 'metadata',
    actionUrl: 'action_url',
    senderId: 'sender_id',
    senderName: 'sender_name',
    emailSubject: 'email_subject',
    emailTemplate: 'email_template',
    smsPhoneNumber: 'sms_phone_number',
    expiresAt: 'expires_at',
    sentAt: 'sent_at',
    deliveredAt: 'delivered_at',
    readAt: 'read_at',
    failedAt: 'failed_at',
    errorMessage: 'error_message',
    retryCount: 'retry_count',
    maxRetries: 'max_retries',
    nextRetryAt: 'next_retry_at'
  };

  const dbData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && fieldMap[key]) {
      dbData[fieldMap[key]] = value;
    }
  }
  return dbData;
};

/**
 * Convert database record to model format
 */
const _toModel = (dbRecord) => {
  if (!dbRecord) return null;

  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    notificationType: dbRecord.notification_type,
    channel: dbRecord.channel,
    title: dbRecord.title,
    message: dbRecord.message,
    status: dbRecord.status,
    priority: dbRecord.priority,
    relatedEntityType: dbRecord.related_entity_type,
    relatedEntityId: dbRecord.related_entity_id,
    metadata: dbRecord.metadata,
    actionUrl: dbRecord.action_url,
    senderId: dbRecord.sender_id,
    senderName: dbRecord.sender_name,
    emailSubject: dbRecord.email_subject,
    emailTemplate: dbRecord.email_template,
    smsPhoneNumber: dbRecord.sms_phone_number,
    sentAt: dbRecord.sent_at,
    deliveredAt: dbRecord.delivered_at,
    readAt: dbRecord.read_at,
    failedAt: dbRecord.failed_at,
    errorMessage: dbRecord.error_message,
    retryCount: dbRecord.retry_count,
    maxRetries: dbRecord.max_retries,
    nextRetryAt: dbRecord.next_retry_at,
    expiresAt: dbRecord.expires_at,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
};

const Notification = {
  // Export constants
  TYPES: NOTIFICATION_TYPES,
  CHANNELS: NOTIFICATION_CHANNELS,
  STATUSES: NOTIFICATION_STATUSES,
  PRIORITIES: NOTIFICATION_PRIORITIES,

  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async create(data) {
    const supabase = getSupabase();
    const dbData = _toDbFields(data);

    // Set defaults
    if (!dbData.channel) dbData.channel = 'portal';
    if (!dbData.status) dbData.status = 'pending';
    if (!dbData.priority) dbData.priority = 'normal';

    const { data: notification, error } = await supabase
      .from(TABLE_NAME)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[Notification.create] Error:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    console.log(`[Notification] Created notification ${notification.id} for user ${notification.user_id}`);
    return _toModel(notification);
  },

  /**
   * Create multiple notifications at once
   * @param {Array} dataArray - Array of notification data
   * @returns {Promise<Array>} Created notifications
   */
  async createMany(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];

    const supabase = getSupabase();
    const dbDataArray = dataArray.map(data => {
      const dbData = _toDbFields(data);
      if (!dbData.channel) dbData.channel = 'portal';
      if (!dbData.status) dbData.status = 'pending';
      if (!dbData.priority) dbData.priority = 'normal';
      return dbData;
    });

    const { data: notifications, error } = await supabase
      .from(TABLE_NAME)
      .insert(dbDataArray)
      .select();

    if (error) {
      console.error('[Notification.createMany] Error:', error);
      throw new Error(`Failed to create notifications: ${error.message}`);
    }

    console.log(`[Notification] Created ${notifications.length} notifications`);
    return notifications.map(_toModel);
  },

  /**
   * Find notification by ID
   * @param {string} id - Notification ID
   * @returns {Promise<Object|null>} Notification or null
   */
  async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Notification.findById] Error:', error);
      throw new Error(`Failed to find notification: ${error.message}`);
    }

    return _toModel(data);
  },

  /**
   * Find notifications by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Notifications
   */
  async findByUserId(userId, options = {}) {
    const supabase = getSupabase();
    const { limit = 50, offset = 0, unreadOnly = false, channel = null, type = null } = options;

    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    if (channel) {
      query = query.eq('channel', channel);
    }

    if (type) {
      query = query.eq('notification_type', type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[Notification.findByUserId] Error:', error);
      throw new Error(`Failed to find notifications: ${error.message}`);
    }

    return (data || []).map(_toModel);
  },

  /**
   * Find unread notifications by user ID
   * @param {string} userId - User ID
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Unread notifications
   */
  async findUnreadByUserId(userId, limit = 20) {
    return this.findByUserId(userId, { limit, unreadOnly: true });
  },

  /**
   * Get unread notification count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    const supabase = getSupabase();

    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('[Notification.getUnreadCount] Error:', error);
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object|null>} Updated notification
   */
  async markAsRead(id, userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .is('read_at', null)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Notification.markAsRead] Error:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return _toModel(data);
  },

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of updated notifications
   */
  async markAllAsRead(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .is('read_at', null)
      .select();

    if (error) {
      console.error('[Notification.markAllAsRead] Error:', error);
      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }

    console.log(`[Notification] Marked ${data?.length || 0} notifications as read for user ${userId}`);
    return data?.length || 0;
  },

  /**
   * Mark notification as sent
   * @param {string} id - Notification ID
   * @returns {Promise<Object|null>} Updated notification
   */
  async markAsSent(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Notification.markAsSent] Error:', error);
      throw new Error(`Failed to mark notification as sent: ${error.message}`);
    }

    return _toModel(data);
  },

  /**
   * Mark notification as delivered
   * @param {string} id - Notification ID
   * @returns {Promise<Object|null>} Updated notification
   */
  async markAsDelivered(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Notification.markAsDelivered] Error:', error);
      throw new Error(`Failed to mark notification as delivered: ${error.message}`);
    }

    return _toModel(data);
  },

  /**
   * Mark notification as failed
   * @param {string} id - Notification ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object|null>} Updated notification
   */
  async markAsFailed(id, errorMessage) {
    const supabase = getSupabase();

    // Get current notification to check retry count
    const current = await this.findById(id);
    const newRetryCount = (current?.retryCount || 0) + 1;

    const updateData = {
      status: 'failed',
      failed_at: new Date().toISOString(),
      error_message: errorMessage,
      retry_count: newRetryCount
    };

    // If we can still retry, set next retry time
    if (current && newRetryCount < (current.maxRetries || 3)) {
      const nextRetry = new Date();
      nextRetry.setMinutes(nextRetry.getMinutes() + 5 * newRetryCount); // Exponential backoff
      updateData.next_retry_at = nextRetry.toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Notification.markAsFailed] Error:', error);
      throw new Error(`Failed to mark notification as failed: ${error.message}`);
    }

    return _toModel(data);
  },

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<boolean>} Success
   */
  async delete(id, userId) {
    const supabase = getSupabase();

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Notification.delete] Error:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return true;
  },

  /**
   * Delete old read notifications
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Count of deleted notifications
   */
  async deleteOldRead(daysOld = 30) {
    const supabase = getSupabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('status', 'read')
      .lt('read_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('[Notification.deleteOldRead] Error:', error);
      throw new Error(`Failed to delete old notifications: ${error.message}`);
    }

    console.log(`[Notification] Deleted ${data?.length || 0} old read notifications`);
    return data?.length || 0;
  },

  /**
   * Delete expired notifications
   * @returns {Promise<number>} Count of deleted notifications
   */
  async deleteExpired() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('status', 'in', '("read","delivered")')
      .select();

    if (error) {
      console.error('[Notification.deleteExpired] Error:', error);
      throw new Error(`Failed to delete expired notifications: ${error.message}`);
    }

    console.log(`[Notification] Deleted ${data?.length || 0} expired notifications`);
    return data?.length || 0;
  }
};

module.exports = Notification;
