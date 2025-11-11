// models/supabase/project.js
const { getSupabase } = require('../../config/database');

class Project {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project
   */
  static async create(projectData) {
    const supabase = getSupabase();

    const dbData = this._toDbFields(projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Find project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} Project or null
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('projects')
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
   * Find one project by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Project or null
   */
  static async findOne(criteria) {
    const supabase = getSupabase();

    let query = supabase.from('projects').select('*');

    const dbCriteria = this._toDbFields(criteria);

    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this._toModel(data);
  }

  /**
   * Find projects by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of projects
   */
  static async find(criteria = {}) {
    const supabase = getSupabase();

    let query = supabase.from('projects').select('*');

    const dbCriteria = this._toDbFields(criteria);

    Object.entries(dbCriteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) throw error;

    return data.map(project => this._toModel(project));
  }

  /**
   * Find all available projects (available and not paused)
   * @returns {Promise<Array>} Array of available projects sorted by annual rate
   */
  static async findAvailable() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('available', true)
      .eq('paused', false)
      .order('anual_rate', { ascending: false });

    if (error) throw error;

    return data.map(project => this._toModel(project));
  }

  /**
   * Find projects by minimum ticket range
   * @param {number} minUSD - Minimum USD
   * @param {number} maxUSD - Maximum USD
   * @returns {Promise<Array>} Array of projects
   */
  static async findByTicketRange(minUSD, maxUSD) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .gte('minimum_ticket_usd', minUSD)
      .lte('minimum_ticket_usd', maxUSD)
      .eq('available', true)
      .eq('paused', false)
      .order('anual_rate', { ascending: false });

    if (error) throw error;

    return data.map(project => this._toModel(project));
  }

  /**
   * Find by address (partial match, case insensitive)
   * @param {string} addressQuery - Address query
   * @returns {Promise<Array>} Array of projects
   */
  static async findByAddress(addressQuery) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .ilike('address', `%${addressQuery}%`);

    if (error) throw error;

    return data.map(project => this._toModel(project));
  }

  /**
   * Update project by ID
   * @param {string} id - Project ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated project
   */
  static async findByIdAndUpdate(id, updateData, options = {}) {
    const supabase = getSupabase();

    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('projects')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Delete project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Deleted project
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this._toModel(data);
  }

  /**
   * Convert database fields to model fields
   * @param {Object} dbProject - Project from database
   * @returns {Object} Project model
   * @private
   */
  static _toModel(dbProject) {
    if (!dbProject) return null;

    const model = {
      id: dbProject.id,
      name: dbProject.name,
      address: dbProject.address,
      image: dbProject.image,
      anualRate: parseFloat(dbProject.anual_rate),
      estimateGain: parseFloat(dbProject.estimate_gain),
      minimumTicketUSD: parseFloat(dbProject.minimum_ticket_usd),
      minumumTicketMXN: parseFloat(dbProject.minumum_ticket_mxn),
      available: dbProject.available,
      paused: dbProject.paused,
      userCreatorId: dbProject.user_creator_id,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,

      // Virtual: Check if project is actively available
      get isActive() {
        return this.available && !this.paused;
      },

      // Instance method to check if project is actively available
      isActivelyAvailable() {
        return this.available && !this.paused;
      },

      // Instance method to calculate estimated return
      calculateEstimatedReturn(investmentAmount, currency = 'USD') {
        const minTicket = currency === 'USD' ? this.minimumTicketUSD : this.minumumTicketMXN;

        if (investmentAmount < minTicket) {
          throw new Error(`Investment amount must be at least ${minTicket} ${currency}`);
        }

        const annualReturn = (investmentAmount * this.anualRate) / 100;
        const totalReturn = investmentAmount + annualReturn;

        return {
          investmentAmount,
          currency,
          annualRate: this.anualRate,
          estimatedAnnualReturn: annualReturn,
          estimatedTotalReturn: totalReturn,
          estimatedGain: this.estimateGain
        };
      },

      // Instance method to mark as available
      async makeAvailable() {
        return Project.findByIdAndUpdate(this.id, {
          available: true,
          paused: false
        });
      },

      // Instance method to mark as unavailable
      async makeUnavailable() {
        return Project.findByIdAndUpdate(this.id, {
          available: false
        });
      },

      // Instance method to pause
      async pause() {
        return Project.findByIdAndUpdate(this.id, {
          paused: true
        });
      },

      // Instance method to unpause
      async unpause() {
        return Project.findByIdAndUpdate(this.id, {
          paused: false
        });
      },

      // Include virtuals when converting to JSON
      toJSON() {
        const obj = { ...this };
        obj.isActive = this.isActive;
        delete obj.toJSON;
        return obj;
      },

      toObject() {
        const obj = { ...this };
        obj.isActive = this.isActive;
        delete obj.toObject;
        return obj;
      }
    };

    return model;
  }

  /**
   * Convert model fields to database fields
   * @param {Object} modelData - Data in camelCase
   * @returns {Object} Data in snake_case
   * @private
   */
  static _toDbFields(modelData) {
    const dbData = {};

    const fieldMap = {
      userCreatorId: 'user_creator_id',
      anualRate: 'anual_rate',
      estimateGain: 'estimate_gain',
      minimumTicketUSD: 'minimum_ticket_usd',
      minumumTicketMXN: 'minumum_ticket_mxn',
    };

    Object.entries(modelData).forEach(([key, value]) => {
      // Skip methods and computed properties
      if (typeof value === 'function' || key === 'isActive') {
        return;
      }
      const dbKey = fieldMap[key] || key;
      dbData[dbKey] = value;
    });

    return dbData;
  }
}

module.exports = Project;
