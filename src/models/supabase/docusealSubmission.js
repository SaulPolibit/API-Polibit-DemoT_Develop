/**
 * DocusealSubmission Supabase Model
 * Handles DocuSeal submission tracking
 */

const { getSupabase } = require('../../config/database');

class DocusealSubmission {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      email: 'email',
      submissionId: 'submission_id',
      submissionURL: 'submission_url',
      auditLogUrl: 'audit_log_url',
      status: 'status',
      userId: 'user_id',
      contractTemplateId: 'contract_template_id',
      managementStatus: 'management_status',
      managementSubmissionId: 'management_submission_id',
      managementSignedAt: 'management_signed_at',
      triggerPoint: 'trigger_point',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
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
      email: dbData.email,
      submissionId: dbData.submission_id,
      submissionURL: dbData.submission_url,
      auditLogUrl: dbData.audit_log_url,
      status: dbData.status,
      userId: dbData.user_id,
      contractTemplateId: dbData.contract_template_id,
      managementStatus: dbData.management_status,
      managementSubmissionId: dbData.management_submission_id,
      managementSignedAt: dbData.management_signed_at,
      triggerPoint: dbData.trigger_point,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * Create a new DocuSeal submission record
   * @param {Object} data - Submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(data) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(data);

    const { data: result, error } = await supabase
      .from('docuseal_submissions')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(result);
  }

  /**
   * Find submission by ID
   * @param {string} id - Submission ID
   * @returns {Promise<Object|null>} Submission or null
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
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
   * Find submission by submission ID
   * @param {number} submissionId - DocuSeal submission ID
   * @returns {Promise<Object|null>} Submission or null
   */
  static async findBySubmissionId(submissionId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find submissions by email
   * @param {string} email - Email address
   * @returns {Promise<Array>} Array of submissions
   */
  static async findByEmail(email) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .select('*')
      .eq('email', email.toLowerCase());

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Find submissions by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of submissions
   */
  static async find(criteria = {}) {
    const supabase = getSupabase();
    const dbCriteria = this._toDbFields(criteria);

    let query = supabase.from('docuseal_submissions').select('*');

    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Update submission by ID
   * @param {string} id - Submission ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated submission
   */
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Delete submission by ID
   * @param {string} id - Submission ID
   * @returns {Promise<Object>} Deleted submission
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Get submissions pending management countersignature
   * @returns {Promise<Array>} Array of submissions with management_status = 'pending'
   */
  static async getPendingCountersigns() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .select('*')
      .eq('management_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Update management countersign status
   * @param {string} id - Submission UUID
   * @param {string} status - New management status ('pending', 'completed', 'not_required')
   * @param {number} managementSubmissionId - DocuSeal submission ID for management signing
   * @returns {Promise<Object>} Updated submission
   */
  static async updateManagementStatus(id, status, managementSubmissionId) {
    const supabase = getSupabase();

    const updateData = { management_status: status };
    if (managementSubmissionId !== undefined) {
      updateData.management_submission_id = managementSubmissionId;
    }
    if (status === 'completed') {
      updateData.management_signed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Find submission by management submission ID
   * @param {number} managementSubmissionId - DocuSeal management submission ID
   * @returns {Promise<Object|null>} Submission or null
   */
  static async findByManagementSubmissionId(managementSubmissionId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('docuseal_submissions')
      .select('*')
      .eq('management_submission_id', managementSubmissionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }
}

module.exports = DocusealSubmission;
