---
title: "Reference: Model CRUD Patterns"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Model CRUD Patterns

All Supabase models follow a consistent class-based pattern with static methods and camelCase↔snake_case field mapping.

## Base Model Structure

```javascript
const { getSupabase } = require('../../config/database');

class ModelName {
  // ─── CREATE ───
  static async create(data) {
    const supabase = getSupabase();
    const dbData = {
      // camelCase → snake_case mapping
      field_name: data.fieldName,
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('table_name')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(result);
  }

  // ─── READ (by ID) ───
  static async findById(id) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.fromDatabase(data);
  }

  // ─── READ (query) ───
  static async find(criteria = {}) {
    const supabase = getSupabase();
    let query = supabase.from('table_name').select('*');

    // Apply filters from criteria
    Object.entries(criteria).forEach(([key, value]) => {
      query = query.eq(this.toSnakeCase(key), value);
    });

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => this.fromDatabase(item));
  }

  // ─── UPDATE ───
  static async findByIdAndUpdate(id, updateData) {
    const supabase = getSupabase();
    const dbData = {};

    // Map only provided fields to snake_case
    if (updateData.fieldName !== undefined) dbData.field_name = updateData.fieldName;
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('table_name')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  // ─── DELETE ───
  static async findByIdAndDelete(id) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  // ─── MAPPING: DB → JS ───
  static fromDatabase(dbRecord) {
    if (!dbRecord) return null;
    return {
      id: dbRecord.id,
      fieldName: dbRecord.field_name,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  // ─── HELPER ───
  static toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = ModelName;
```

## Standard Method Signatures

All models expose these static methods (when applicable):

| Method | Signature | Returns |
|--------|-----------|---------|
| `create` | `create(data)` | Single mapped object |
| `findById` | `findById(id)` | Single mapped object or `null` |
| `findByIdAndUpdate` | `findByIdAndUpdate(id, updateData)` | Updated mapped object |
| `findByIdAndDelete` | `findByIdAndDelete(id)` | Deleted mapped object |
| `find` | `find(criteria)` | Array of mapped objects |

## User Model Specifics

The User model has additional patterns:

```javascript
// Password hashing on create
static async create(userData) {
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  } else {
    // OAuth users get a random 64-char password
    const randomPassword = crypto.randomBytes(32).toString('hex');
    userData.password = await bcrypt.hash(randomPassword, salt);
  }
  // ... standard insert
}

// Role validation (required on create)
static isValidRole(role) {
  return role === 0 || role === 1 || role === 2 || role === 3 || role === 4;
}
```

## Field Mapping Convention

| JavaScript (camelCase) | Database (snake_case) |
|------------------------|----------------------|
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `isActive` | `is_active` |
| `structureId` | `structure_id` |
| `createdBy` | `created_by` |
| `profileImage` | `profile_image` |

## Query Patterns

### Pagination
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false });
```

### Related Data (Joins)
```javascript
const { data, error } = await supabase
  .from('capital_calls')
  .select(`
    *,
    structure:structures(name, currency),
    allocations:capital_call_allocations(*)
  `)
  .eq('id', capitalCallId)
  .single();
```

### Bulk Operations
```javascript
// Bulk insert
const { data, error } = await supabase
  .from('notifications')
  .insert(records)
  .select();

// Bulk update by condition
const { data, error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('user_id', userId)
  .eq('is_read', false);
```

### Upsert
```javascript
const { data, error } = await supabase
  .from('presence')
  .upsert({
    user_id: userId,
    status: 'online',
    last_seen: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  .select()
  .single();
```
