---
name: supabase-database
description: "Activate when working with database queries, Supabase models, table schemas, CRUD operations, storage, or data layer. Trigger phrases: 'database', 'model', 'table', 'query', 'supabase', 'schema', 'CRUD', 'storage'. NOT for authentication (use auth-security) or realtime subscriptions on the frontend."
---

# Supabase Database — Models & Storage

## Purpose

This skill covers the Supabase (PostgreSQL) data layer for the API backend. It includes the database connection setup, 34 model files with standardized CRUD patterns, and the dual-key architecture (service role for backend operations, anon key for realtime).

## Architecture

```
src/config/database.js          → Supabase client initialization (dual-key)
src/models/supabase/index.js    → Barrel exports for all 34 models
src/models/supabase/*.js        → Individual model files (class-based, static methods)
```

**Dual-Key Pattern:**
- `SUPABASE_SERVICE_ROLE_KEY` — Used by `getSupabase()` for all backend CRUD (bypasses RLS)
- `SUPABASE_ANON_KEY` — Used by `getSupabaseRealtime()` for WebSocket/Realtime channels

**Auto-initialization:** The `getSupabase()` function auto-initializes for serverless environments (Vercel) when the client hasn't been explicitly connected via `connectDB()`.

## Key Files

| File | Purpose |
|------|---------|
| `src/config/database.js` | Supabase client init: `connectDB()`, `getSupabase()`, `getSupabaseRealtime()` |
| `src/models/supabase/index.js` | Barrel file exporting all 34 models |
| `src/models/supabase/user.js` | User model (32KB, largest — includes bcrypt, role validation) |
| `src/models/supabase/structure.js` | Structure/fund model (20KB — complex queries) |
| `src/models/supabase/capitalCall.js` | Capital call model (39KB — allocations, waterfall) |
| `src/models/supabase/notification.js` | Notification model (13KB — bulk operations) |
| `src/models/supabase/investor.js` | Investor model (10KB — deprecated, use StructureInvestor) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (e.g., `https://your-project.supabase.co`) |
| `SUPABASE_ANON_KEY` | Public anon key (used for Realtime only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS, used for all backend CRUD) |

## Model Categories

**Core:** User, Company, NotificationSettings, Project, SmartContract

**Investment Manager:** Structure, StructureAdmin, StructureInvestor, Investor (deprecated), Investment, CapitalCall, Distribution, WaterfallTier, Document, DrawdownNoticeTemplate

**Chat System:** Conversation, ConversationParticipant, Message, MessageRead, MessageAttachment

**Email System:** EmailSettings, EmailLog, EmailDomain

**Auth/KYC:** MFAFactor, KycSession

**DocuSeal:** DocusealSubmission

**Payments:** Payment, Subscription, InvestmentSubscription

**Settings:** FirmSettings, Notification, Presence

## Common Tasks

### Add a new model
1. Create `src/models/supabase/newModel.js` following the class pattern (see `references/model-patterns.md`)
2. Export from `src/models/supabase/index.js`
3. Use `getSupabase()` for all queries
4. Map camelCase (JS) ↔ snake_case (DB) in both directions

### Query with filters
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value)
  .order('created_at', { ascending: false });
```

### Add a new table
1. Add SQL migration to `docs/supabase-schema.sql`
2. Create corresponding model in `src/models/supabase/`
3. Add to barrel exports in `index.js`

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Missing Supabase credentials" | Env vars not set | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| RLS policy blocking queries | Using anon key for backend | Ensure `getSupabase()` uses `SERVICE_ROLE_KEY` |
| Tables not found | Schema not applied | Run `docs/supabase-schema.sql` in Supabase dashboard |
| camelCase/snake_case mismatch | Field mapping missing | Check `toDatabase()` / `fromDatabase()` mappings in model |

## References

- [Model CRUD Patterns](references/model-patterns.md)
- [Table Schema Reference](references/table-schema.md)
