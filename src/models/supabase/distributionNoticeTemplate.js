/**
 * DistributionNoticeTemplate Supabase Model
 * Handles per-structure templates for generating distribution notice PDFs.
 * One template per structure, reused across distributions.
 */

const { getSupabase } = require('../../config/database');

class DistributionNoticeTemplate {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      structureId: 'structure_id',
      headerTitle: 'header_title',
      headerSubtitle: 'header_subtitle',
      includeFirmLogo: 'include_firm_logo',
      legalDescription: 'legal_description',
      footerSignatoryName: 'footer_signatory_name',
      footerSignatoryTitle: 'footer_signatory_title',
      footerCompanyName: 'footer_company_name',
      footerAdditionalNotes: 'footer_additional_notes',
      createdBy: 'created_by',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
      headerTitle: dbData.header_title,
      headerSubtitle: dbData.header_subtitle,
      includeFirmLogo: dbData.include_firm_logo,
      legalDescription: dbData.legal_description,
      footerSignatoryName: dbData.footer_signatory_name,
      footerSignatoryTitle: dbData.footer_signatory_title,
      footerCompanyName: dbData.footer_company_name,
      footerAdditionalNotes: dbData.footer_additional_notes,
      createdBy: dbData.created_by,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }

  /**
   * Find template by structure ID
   */
  static async findByStructureId(structureId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('distribution_notice_templates')
      .select('*')
      .eq('structure_id', structureId)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find template by ID
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('distribution_notice_templates')
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
   * Create a new template
   */
  static async create(data) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(data);

    const { data: result, error } = await supabase
      .from('distribution_notice_templates')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(result);
  }

  /**
   * Update an existing template by ID
   */
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('distribution_notice_templates')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Create or update template for a structure (upsert)
   */
  static async upsertByStructureId(structureId, templateData) {
    const existing = await this.findByStructureId(structureId);

    if (existing) {
      return this.findByIdAndUpdate(existing.id, templateData);
    }

    return this.create({ ...templateData, structureId });
  }

  /**
   * Delete template by structure ID
   */
  static async deleteByStructureId(structureId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('distribution_notice_templates')
      .delete()
      .eq('structure_id', structureId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Delete template by ID
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('distribution_notice_templates')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }
}

module.exports = DistributionNoticeTemplate;
