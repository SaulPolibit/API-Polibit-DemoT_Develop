// models/supabase/company.js
const { getSupabase } = require('../../config/database');

class Company {
  /**
   * Create a new company
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} Created company
   */
  static async create(companyData) {
    const supabase = getSupabase();

    // Convert camelCase to snake_case for database
    const dbData = this._toDbFields(companyData);

    const { data, error } = await supabase
      .from('companies')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Find company by ID
   * @param {string} id - Company ID
   * @returns {Promise<Object|null>} Company or null
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find company by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Company or null
   */
  static async findByUserId(userId) {
    return this.findOne({ userId });
  }

  /**
   * Find company by firm email
   * @param {string} email - Firm email
   * @returns {Promise<Object|null>} Company or null
   */
  static async findByEmail(email) {
    return this.findOne({ firmEmail: email });
  }

  /**
   * Find one company by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Company or null
   */
  static async findOne(criteria) {
    const supabase = getSupabase();

    let query = supabase.from('companies').select('*');

    // Convert camelCase criteria to snake_case
    const dbCriteria = this._toDbFields(criteria);

    // Apply filters
    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find companies by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of companies
   */
  static async find(criteria = {}) {
    const supabase = getSupabase();

    let query = supabase.from('companies').select('*');

    // Convert camelCase criteria to snake_case
    const dbCriteria = this._toDbFields(criteria);

    // Apply filters
    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) throw error;

    return data.map(company => this._toModel(company));
  }

  /**
   * Update company by ID
   * @param {string} id - Company ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated company
   */
  static async findByIdAndUpdate(id, updateData, options = {}) {
    const supabase = getSupabase();

    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('companies')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Find and update or create company (upsert)
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update or insert
   * @param {Object} options - Options (new: true returns updated doc)
   * @returns {Promise<Object>} Updated or created company
   */
  static async findOneAndUpdate(filter, updateData, options = {}) {
    const supabase = getSupabase();

    const dbFilter = this._toDbFields(filter);
    const dbData = this._toDbFields(updateData);

    // If upsert is true, use Supabase's upsert functionality
    if (options.upsert) {
      // For upsert, we need to include the filter criteria in the data
      const upsertData = { ...dbData, ...dbFilter };

      const { data, error } = await supabase
        .from('companies')
        .upsert([upsertData], {
          onConflict: 'user_id', // Assuming user_id is the unique constraint
          returning: 'representation'
        })
        .select()
        .single();

      if (error) throw error;

      return this._toModel(data);
    }

    // Otherwise, try to find and update
    let query = supabase.from('companies').select('*');

    Object.entries(dbFilter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: existing, error: findError } = await query.single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('companies')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return this._toModel(data);
    }

    return null;
  }

  /**
   * Delete company by ID
   * @param {string} id - Company ID
   * @returns {Promise<Object>} Deleted company
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Convert database fields to model fields (snake_case to camelCase)
   * @param {Object} dbCompany - Company from database
   * @returns {Object} Company model
   * @private
   */
  static _toModel(dbCompany) {
    if (!dbCompany) return null;

    return {
      id: dbCompany.id,
      userId: dbCompany.user_id,
      firmName: dbCompany.firm_name,
      firmLogo: dbCompany.firm_logo,
      firmEmail: dbCompany.firm_email,
      firmPhone: dbCompany.firm_phone,
      websiteURL: dbCompany.website_url,
      address: dbCompany.address,
      description: dbCompany.description,
      createdAt: dbCompany.created_at,
      updatedAt: dbCompany.updated_at,
    };
  }

  /**
   * Convert model fields to database fields (camelCase to snake_case)
   * @param {Object} modelData - Data in camelCase
   * @returns {Object} Data in snake_case
   * @private
   */
  static _toDbFields(modelData) {
    const dbData = {};

    const fieldMap = {
      userId: 'user_id',
      firmName: 'firm_name',
      firmLogo: 'firm_logo',
      firmEmail: 'firm_email',
      firmPhone: 'firm_phone',
      websiteURL: 'website_url',
    };

    Object.entries(modelData).forEach(([key, value]) => {
      const dbKey = fieldMap[key] || key;
      dbData[dbKey] = value;
    });

    return dbData;
  }
}

module.exports = Company;
