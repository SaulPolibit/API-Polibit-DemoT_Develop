/**
 * InvestmentSubscription Supabase Model
 * Handles investor subscriptions to investments
 */

const { getSupabase } = require('../../config/database');

class InvestmentSubscription {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      investmentId: 'investment_id',
      investorId: 'user_id',
      userId: 'user_id',
      fundId: 'fund_id',
      requestedAmount: 'requested_amount',
      currency: 'currency',
      status: 'status',
      approvalReason: 'approval_reason',
      createdAt: 'created_at',
      submittedAt: 'submitted_at',
      approvedAt: 'approved_at',
      rejectedAt: 'rejected_at',
      adminNotes: 'admin_notes',
      linkedFundOwnershipCreated: 'linked_fund_ownership_created'
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
      if (data[camelKey] !== undefined) {
        dbData[snakeKey] = data[camelKey];
      }
    }

    return dbData;
  }

  /**
   * Convert snake_case database fields to camelCase for model
   */
  static _toModel(dbData) {
    if (!dbData) return null;

    return {
      id: dbData.id,
      investmentId: dbData.investment_id,
      userId: dbData.user_id,
      investorId: dbData.user_id, // Keep for backward compatibility
      fundId: dbData.fund_id,
      requestedAmount: dbData.requested_amount,
      currency: dbData.currency,
      status: dbData.status,
      approvalReason: dbData.approval_reason,
      createdAt: dbData.created_at,
      submittedAt: dbData.submitted_at,
      approvedAt: dbData.approved_at,
      rejectedAt: dbData.rejected_at,
      adminNotes: dbData.admin_notes,
      linkedFundOwnershipCreated: dbData.linked_fund_ownership_created
    };
  }

  /**
   * Create a new investment subscription
   */
  static async create(data) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(data);

    const { data: result, error } = await supabase
      .from('investment_subscriptions')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(result);
  }

  /**
   * Find investment subscription by ID
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find subscriptions by investment ID
   */
  static async findByInvestmentId(investmentId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .select('*')
      .eq('investment_id', investmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find subscriptions by user ID (investor)
   */
  static async findByInvestorId(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Alias for findByInvestorId
   */
  static async findByUserId(userId) {
    return this.findByInvestorId(userId);
  }

  /**
   * Find subscriptions by fund ID
   */
  static async findByFundId(fundId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find subscriptions by status
   */
  static async findByStatus(status) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find subscriptions with filters
   */
  static async find(criteria = {}) {
    const supabase = getSupabase();
    const dbCriteria = this._toDbFields(criteria);

    let query = supabase.from('investment_subscriptions').select('*');

    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Update investment subscription
   */
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Delete investment subscription
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('investment_subscriptions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Approve subscription
   */
  static async approve(id, approvalReason = null) {
    return this.findByIdAndUpdate(id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvalReason
    });
  }

  /**
   * Reject subscription
   */
  static async reject(id, approvalReason = null) {
    return this.findByIdAndUpdate(id, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      approvalReason
    });
  }

  /**
   * Submit subscription
   */
  static async submit(id) {
    return this.findByIdAndUpdate(id, {
      status: 'submitted',
      submittedAt: new Date().toISOString()
    });
  }
}

module.exports = InvestmentSubscription;
