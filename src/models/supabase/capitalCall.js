/**
 * CapitalCall Supabase Model
 * Handles capital call requests and investor allocations
 */

const { getSupabase } = require('../../config/database');

class CapitalCall {
  /**
   * Convert camelCase fields to snake_case for database
   */
  static _toDbFields(data) {
    const dbData = {};
    const fieldMap = {
      id: 'id',
      structureId: 'structure_id',
      callNumber: 'call_number',
      callDate: 'call_date',
      dueDate: 'due_date',
      totalCallAmount: 'total_call_amount',
      totalPaidAmount: 'total_paid_amount',
      totalUnpaidAmount: 'total_unpaid_amount',
      status: 'status',
      purpose: 'purpose',
      notes: 'notes',
      investmentId: 'investment_id',
      sentDate: 'sent_date',
      // ILPA Fee Configuration
      managementFeeBase: 'management_fee_base',
      managementFeeRate: 'management_fee_rate',
      vatRate: 'vat_rate',
      vatApplicable: 'vat_applicable',
      feePeriod: 'fee_period',
      approvalStatus: 'approval_status',
      createdBy: 'created_by',
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
      structureId: dbData.structure_id,
      callNumber: dbData.call_number,
      callDate: dbData.call_date,
      dueDate: dbData.due_date,
      totalCallAmount: dbData.total_call_amount,
      totalPaidAmount: dbData.total_paid_amount,
      totalUnpaidAmount: dbData.total_unpaid_amount,
      status: dbData.status,
      purpose: dbData.purpose,
      notes: dbData.notes,
      investmentId: dbData.investment_id,
      sentDate: dbData.sent_date,
      // ILPA Fee Configuration
      managementFeeBase: dbData.management_fee_base,
      managementFeeRate: dbData.management_fee_rate,
      vatRate: dbData.vat_rate,
      vatApplicable: dbData.vat_applicable,
      feePeriod: dbData.fee_period,
      approvalStatus: dbData.approval_status,
      createdBy: dbData.created_by,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * Create a new capital call
   */
  static async create(capitalCallData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(capitalCallData);

    const { data, error } = await supabase
      .from('capital_calls')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating capital call: ${error.message}`);
    }

    return this._toModel(data);
  }

  /**
   * Find capital call by ID
   */
  static async findById(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('capital_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Error finding capital call: ${error.message}`);
    }

    return this._toModel(data);
  }

  /**
   * Find capital calls by filter
   */
  static async find(filter = {}) {
    const supabase = getSupabase();
    const dbFilter = this._toDbFields(filter);

    let query = supabase.from('capital_calls').select('*');

    // Apply filters
    for (const [key, value] of Object.entries(dbFilter)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    query = query.order('call_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error finding capital calls: ${error.message}`);
    }

    return data.map(item => this._toModel(item));
  }

  /**
   * Find capital calls by structure ID
   */
  static async findByStructureId(structureId) {
    return this.find({ structureId });
  }

  /**
   * Find capital calls by user ID
   */
  static async findByUserId(userId) {
    return this.find({ createdBy: userId });
  }

  /**
   * Find capital calls by status
   */
  static async findByStatus(status, structureId) {
    const filter = { status };
    if (structureId) filter.structureId = structureId;
    return this.find(filter);
  }

  /**
   * Find capital calls by approval status (for approval workflow)
   * Supports filtering by single status, array of statuses, or with user filter
   */
  static async findByApprovalStatus(filter = {}) {
    const supabase = getSupabase();

    let query = supabase
      .from('capital_calls')
      .select(`
        *,
        structures:structure_id (
          id,
          name,
          type
        )
      `);

    // Filter by single approval status
    if (filter.approvalStatus) {
      query = query.eq('approval_status', filter.approvalStatus);
    }

    // Filter by array of approval statuses (IN clause)
    if (filter.approvalStatusIn && Array.isArray(filter.approvalStatusIn)) {
      query = query.in('approval_status', filter.approvalStatusIn);
    }

    // Filter by creator
    if (filter.createdBy) {
      query = query.eq('created_by', filter.createdBy);
    }

    // Filter by structure
    if (filter.structureId) {
      query = query.eq('structure_id', filter.structureId);
    }

    // Order by creation date, newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error finding capital calls by approval status: ${error.message}`);
    }

    return data.map(item => ({
      ...this._toModel(item),
      structure: item.structures ? {
        id: item.structures.id,
        name: item.structures.name,
        type: item.structures.type
      } : null
    }));
  }

  /**
   * Find capital calls by user ID (investor)
   * Gets all capital calls that have allocations for the specified user
   */
  static async findByInvestorId(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('capital_calls')
      .select(`
        *,
        capital_call_allocations!inner (
          user_id
        )
      `)
      .eq('capital_call_allocations.user_id', userId)
      .order('call_date', { ascending: false });

    if (error) {
      throw new Error(`Error finding capital calls by user: ${error.message}`);
    }

    return data.map(item => this._toModel(item));
  }

  /**
   * Update capital call by ID
   */
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = this._toDbFields(updateData);

    const { data, error } = await supabase
      .from('capital_calls')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating capital call: ${error.message}`);
    }

    return this._toModel(data);
  }

  /**
   * Delete capital call by ID
   */
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('capital_calls')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error deleting capital call: ${error.message}`);
    }

    return this._toModel(data);
  }

  /**
   * Get capital call with allocations
   */
  static async findWithAllocations(capitalCallId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('capital_calls')
      .select(`
        *,
        capital_call_allocations (
          *,
          user:users (*)
        )
      `)
      .eq('id', capitalCallId)
      .single();

    if (error) {
      throw new Error(`Error finding capital call with allocations: ${error.message}`);
    }

    return this._toModel(data);
  }

  /**
   * Mark capital call as sent
   */
  static async markAsSent(capitalCallId) {
    return this.findByIdAndUpdate(capitalCallId, {
      status: 'Sent',
      sentDate: new Date().toISOString()
    });
  }

  /**
   * Mark capital call as fully paid
   */
  static async markAsPaid(capitalCallId) {
    return this.findByIdAndUpdate(capitalCallId, {
      status: 'Paid'
    });
  }

  /**
   * Update payment amounts
   */
  static async updatePaymentAmounts(capitalCallId, paidAmount) {
    const capitalCall = await this.findById(capitalCallId);

    if (!capitalCall) {
      throw new Error('Capital call not found');
    }

    const totalPaid = (capitalCall.totalPaidAmount || 0) + paidAmount;
    const totalUnpaid = capitalCall.totalCallAmount - totalPaid;

    const updateData = {
      totalPaidAmount: totalPaid,
      totalUnpaidAmount: totalUnpaid
    };

    // Update status if fully paid
    if (totalUnpaid <= 0) {
      updateData.status = 'Paid';
    } else if (totalPaid > 0 && capitalCall.status === 'Draft') {
      updateData.status = 'Partially Paid';
    }

    return this.findByIdAndUpdate(capitalCallId, updateData);
  }

  /**
   * Get capital call summary for structure
   */
  static async getSummary(structureId) {
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('get_capital_call_summary', {
      structure_id: structureId
    });

    if (error) {
      throw new Error(`Error getting capital call summary: ${error.message}`);
    }

    return data;
  }

  /**
   * Create allocations for all investors in structure
   * Uses the investors table (LP commitments) to find investors assigned to the structure
   */
  static async createAllocationsForStructure(capitalCallId, structureId) {
    const supabase = getSupabase();

    // Get all investors for this structure from the investors table (LP commitments)
    const { data: investors, error: invError } = await supabase
      .from('investors')
      .select('user_id, ownership_percent, commitment')
      .eq('structure_id', structureId);

    if (invError) {
      throw new Error(`Error fetching structure investors: ${invError.message}`);
    }

    // Get unique investors with their ownership percentages
    const investorMap = new Map();
    investors?.forEach(inv => {
      const userId = inv.user_id;
      const ownershipPercent = inv.ownership_percent || 0;
      const commitmentAmount = inv.commitment || 0;

      if (!investorMap.has(userId)) {
        investorMap.set(userId, { ownershipPercent, commitment: commitmentAmount });
      } else {
        // Sum up ownership if multiple investor records for same user
        const existing = investorMap.get(userId);
        investorMap.set(userId, {
          ownershipPercent: existing.ownershipPercent + ownershipPercent,
          commitment: existing.commitment + commitmentAmount
        });
      }
    });

    const structureInvestors = Array.from(investorMap.entries()).map(([userId, data]) => ({
      user_id: userId,
      structure_id: structureId,
      ownership_percent: data.ownershipPercent,
      commitment: data.commitment
    }));

    // Get capital call details
    const capitalCall = await this.findById(capitalCallId);

    if (!capitalCall) {
      throw new Error('Capital call not found');
    }

    // Create allocations based on ownership percentage with ILPA fee breakdown
    const allocations = await Promise.all(structureInvestors.map(async (si) => {
      const principalAmount = capitalCall.totalCallAmount * (si.ownership_percent / 100);

      // Get user's fee discount and VAT exempt status
      const { data: userData } = await supabase
        .from('users')
        .select('fee_discount, vat_exempt')
        .eq('id', si.user_id)
        .single();

      const feeDiscount = userData?.fee_discount || 0;
      const vatExempt = userData?.vat_exempt || false;

      // Calculate management fee if ILPA fee config is set
      let managementFeeGross = 0;
      let managementFeeDiscountAmount = 0;
      let managementFeeNet = 0;
      let vatAmount = 0;

      if (capitalCall.managementFeeRate) {
        // Calculate based on fee period
        let periodRate = capitalCall.managementFeeRate;
        if (capitalCall.feePeriod === 'quarterly') {
          periodRate = capitalCall.managementFeeRate / 4;
        } else if (capitalCall.feePeriod === 'semi-annual') {
          periodRate = capitalCall.managementFeeRate / 2;
        }

        // Fee base is the principal amount for this investor
        managementFeeGross = principalAmount * (periodRate / 100);
        managementFeeDiscountAmount = managementFeeGross * (feeDiscount / 100);
        managementFeeNet = managementFeeGross - managementFeeDiscountAmount;

        // Calculate VAT if applicable
        if (capitalCall.vatApplicable && !vatExempt && capitalCall.vatRate) {
          vatAmount = managementFeeNet * (capitalCall.vatRate / 100);
        }
      }

      const totalDue = principalAmount + managementFeeNet + vatAmount;

      return {
        capital_call_id: capitalCallId,
        user_id: si.user_id,
        allocated_amount: totalDue,
        paid_amount: 0,
        remaining_amount: totalDue,
        status: 'Pending',
        due_date: capitalCall.dueDate,
        // ILPA Fee Breakdown
        principal_amount: principalAmount,
        management_fee_gross: managementFeeGross,
        management_fee_discount: managementFeeDiscountAmount,
        management_fee_net: managementFeeNet,
        vat_amount: vatAmount,
        total_due: totalDue
      };
    }));

    // Insert all allocations
    const { data, error } = await supabase
      .from('capital_call_allocations')
      .insert(allocations)
      .select();

    if (error) {
      throw new Error(`Error creating allocations: ${error.message}`);
    }

    return data;
  }
}

module.exports = CapitalCall;
