/**
 * ContractTemplate Supabase Model
 * Handles contract/action template management for the configurable contract system
 */

const { getSupabase } = require('../../config/database');

class ContractTemplate {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      name: 'name',
      description: 'description',
      docusealTemplateUrl: 'docuseal_template_url',
      type: 'type',
      signatureType: 'signature_type',
      jurisdiction: 'jurisdiction',
      category: 'category',
      displayOrder: 'display_order',
      isActive: 'is_active',
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
      name: dbData.name,
      description: dbData.description,
      docusealTemplateUrl: dbData.docuseal_template_url,
      type: dbData.type,
      signatureType: dbData.signature_type,
      jurisdiction: dbData.jurisdiction,
      category: dbData.category,
      displayOrder: dbData.display_order,
      isActive: dbData.is_active,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * Get all contract templates
   * @param {Object} filters - Optional filters (type, category, jurisdiction, isActive)
   * @returns {Promise<Array>} Array of templates
   */
  static async getAll(filters = {}) {
    const supabase = getSupabase();
    let query = supabase.from('contract_templates').select('*');

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.jurisdiction) query = query.eq('jurisdiction', filters.jurisdiction);
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive === true || filters.isActive === 'true');

    query = query.order('display_order', { ascending: true }).order('name', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Get template by ID
   * @param {string} id - Template UUID
   * @returns {Promise<Object|null>} Template or null
   */
  static async getById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('contract_templates')
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
   * Create a new contract template
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Created template
   */
  static async create(data) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(data);

    const { data: result, error } = await supabase
      .from('contract_templates')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(result);
  }

  /**
   * Update a contract template
   * @param {string} id - Template UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated template
   */
  static async update(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('contract_templates')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Delete a contract template
   * @param {string} id - Template UUID
   * @returns {Promise<Object>} Deleted template
   */
  static async delete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }
}

module.exports = ContractTemplate;
