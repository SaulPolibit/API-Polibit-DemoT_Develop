/**
 * KycSession Supabase Model
 * Handles KYC verification sessions
 */

const { getSupabase } = require('../../config/database');

class KycSession {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      userId: 'user_id',
      sessionId: 'session_id',
      provider: 'provider',
      status: 'status',
      verificationData: 'verification_data',
      pdfUrl: 'pdf_url',
      createdAt: 'created_at',
      completedAt: 'completed_at',
      expiresAt: 'expires_at'
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
      userId: dbData.user_id,
      sessionId: dbData.session_id,
      provider: dbData.provider,
      status: dbData.status,
      verificationData: dbData.verification_data,
      pdfUrl: dbData.pdf_url,
      createdAt: dbData.created_at,
      completedAt: dbData.completed_at,
      expiresAt: dbData.expires_at
    };
  }

  /**
   * Create a new KYC session
   */
  static async create(data) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(data);

    const { data: result, error } = await supabase
      .from('kyc_sessions')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(result);
  }

  /**
   * Find KYC session by ID
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kyc_sessions')
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
   * Find KYC session by session ID
   */
  static async findBySessionId(sessionId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kyc_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find KYC sessions by user ID
   */
  static async findByUserId(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kyc_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find KYC sessions by status
   */
  static async findByStatus(status) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kyc_sessions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find sessions with filters
   */
  static async find(criteria = {}) {
    const supabase = getSupabase();
    const dbCriteria = this._toDbFields(criteria);

    let query = supabase.from('kyc_sessions').select('*');

    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Update KYC session
   */
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('kyc_sessions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Delete KYC session
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error} = await supabase
      .from('kyc_sessions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Complete KYC session
   */
  static async complete(id, verificationData, pdfUrl = null) {
    return this.findByIdAndUpdate(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      verificationData,
      pdfUrl
    });
  }

  /**
   * Fail KYC session
   */
  static async fail(id, reason = null) {
    const verificationData = reason ? { failureReason: reason } : {};
    return this.findByIdAndUpdate(id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      verificationData
    });
  }

  /**
   * Get latest session for user
   */
  static async getLatestForUser(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kyc_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }
}

module.exports = KycSession;
