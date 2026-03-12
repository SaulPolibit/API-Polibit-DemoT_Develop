/**
 * StructureContract Supabase Model
 * Handles contract template assignments to structures with configuration
 */

const { getSupabase } = require('../../config/database');

class StructureContract {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      structureId: 'structure_id',
      contractTemplateId: 'contract_template_id',
      triggerPoint: 'trigger_point',
      signer: 'signer',
      isRequired: 'is_required',
      isBlocking: 'is_blocking',
      signingOrder: 'signing_order',
      displayOrder: 'display_order',
      createdAt: 'created_at'
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
      structureId: dbData.structure_id,
      contractTemplateId: dbData.contract_template_id,
      triggerPoint: dbData.trigger_point,
      signer: dbData.signer,
      isRequired: dbData.is_required,
      isBlocking: dbData.is_blocking,
      signingOrder: dbData.signing_order,
      displayOrder: dbData.display_order,
      createdAt: dbData.created_at
    };
  }

  /**
   * Convert a joined row (structure_contracts + contract_templates) to model
   */
  static _toModelWithTemplate(dbData) {
    if (!dbData) return null;

    const base = this._toModel(dbData);
    if (dbData.contract_templates) {
      const t = dbData.contract_templates;
      base.template = {
        id: t.id,
        name: t.name,
        description: t.description,
        docusealTemplateUrl: t.docuseal_template_url,
        type: t.type,
        signatureType: t.signature_type,
        jurisdiction: t.jurisdiction,
        category: t.category,
        displayOrder: t.display_order,
        isActive: t.is_active
      };
    }
    return base;
  }

  /**
   * Get all assignments for a structure
   * @param {string} structureId - Structure UUID
   * @returns {Promise<Array>} Array of assignments
   */
  static async getByStructureId(structureId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('structure_contracts')
      .select('*')
      .eq('structure_id', structureId)
      .order('signing_order', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data.map(item => this._toModel(item));
  }

  /**
   * Get assignments for a structure with full template data (join)
   * @param {string} structureId - Structure UUID
   * @returns {Promise<Array>} Array of assignments with template info
   */
  static async getByStructureIdWithTemplates(structureId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('structure_contracts')
      .select('*, contract_templates(*)')
      .eq('structure_id', structureId)
      .order('signing_order', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data.map(item => this._toModelWithTemplate(item));
  }

  /**
   * Get assignments filtered by trigger point (with template data)
   * @param {string} structureId - Structure UUID
   * @param {string} triggerPoint - Trigger point filter
   * @returns {Promise<Array>} Filtered assignments with templates
   */
  static async getByStructureIdAndTrigger(structureId, triggerPoint) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('structure_contracts')
      .select('*, contract_templates(*)')
      .eq('structure_id', structureId)
      .eq('trigger_point', triggerPoint)
      .order('signing_order', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Only return assignments whose template is active
    return data
      .filter(item => item.contract_templates && item.contract_templates.is_active)
      .map(item => this._toModelWithTemplate(item));
  }

  /**
   * Assign a contract template to a structure
   * @param {string} structureId - Structure UUID
   * @param {string} contractTemplateId - Contract template UUID
   * @param {Object} options - Assignment config (triggerPoint, signer, isBlocking, etc.)
   * @returns {Promise<Object>} Created assignment
   */
  static async assign(structureId, contractTemplateId, options = {}) {
    const supabase = getSupabase();

    const dbData = {
      structure_id: structureId,
      contract_template_id: contractTemplateId,
      trigger_point: options.triggerPoint || 'pre_payment',
      signer: options.signer || 'investor',
      is_required: options.isRequired !== undefined ? options.isRequired : true,
      is_blocking: options.isBlocking !== undefined ? options.isBlocking : true,
      signing_order: options.signingOrder || 0,
      display_order: options.displayOrder || 0
    };

    const { data, error } = await supabase
      .from('structure_contracts')
      .insert([dbData])
      .select('*, contract_templates(*)')
      .single();

    if (error) throw error;

    return this._toModelWithTemplate(data);
  }

  /**
   * Remove a contract template assignment from a structure
   * @param {string} structureId - Structure UUID
   * @param {string} contractTemplateId - Contract template UUID
   * @returns {Promise<Object>} Deleted assignment
   */
  static async unassign(structureId, contractTemplateId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('structure_contracts')
      .delete()
      .eq('structure_id', structureId)
      .eq('contract_template_id', contractTemplateId)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Update an assignment's configuration
   * @param {string} id - Assignment UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated assignment
   */
  static async updateAssignment(id, updates) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updates);

    const { data, error } = await supabase
      .from('structure_contracts')
      .update(dbData)
      .eq('id', id)
      .select('*, contract_templates(*)')
      .single();

    if (error) throw error;

    return this._toModelWithTemplate(data);
  }

  /**
   * Get a single assignment by ID
   * @param {string} id - Assignment UUID
   * @returns {Promise<Object|null>} Assignment or null
   */
  static async getById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('structure_contracts')
      .select('*, contract_templates(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModelWithTemplate(data);
  }
}

module.exports = StructureContract;
