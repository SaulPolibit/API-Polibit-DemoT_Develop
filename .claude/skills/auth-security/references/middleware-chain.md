---
title: "Reference: Middleware Chain"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Middleware Chain Documentation

## Authentication Middleware (`src/middleware/auth.js`)

### `authenticate` — Main Auth Middleware
Supports dual authentication: Bearer JWT or x-api-key.

```javascript
// Flow:
// 1. Skip OPTIONS requests (CORS preflight)
// 2. Check for Authorization header or x-api-key header
// 3. If Authorization: verify Bearer JWT → attach req.user + req.auth
// 4. If x-api-key: verify via SHA-256 hash comparison → attach req.auth
// 5. If neither: return 401

// After successful auth, request has:
req.user = decoded;  // JWT payload (userId, role, email, etc.)
req.auth = {
  authenticated: true,
  method: 'bearer',      // or 'apikey'
  userId: decoded.userId  // only for bearer
};
```

### `requireApiKey` — API Key Only
Blocks Bearer tokens. Only accepts `x-api-key` header.

### `requireBearerToken` — Bearer Only
Blocks API keys. Only accepts `Authorization: Bearer <token>`.

### `validateClientKey` — Client-Specific Keys
For third-party integrations (Portal HQ, Vudy, Bridge). Reads from `client-api-key` header or `body.clientApiKey`.

```javascript
// After validation:
req.clientAuth = { apiKey: clientKey };
```

### `requireRole(roles)` — Role Check
Must be used AFTER `authenticate`. Checks `req.user.role` against allowed roles.

```javascript
// Usage: single role or array
router.get('/admin', authenticate, requireRole(0), handler);
router.get('/staff', authenticate, requireRole([0, 1, 2]), handler);
```

### `createToken(payload)` — JWT Generation
```javascript
const token = createToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
});
// Returns JWT with 24-hour (86400s) expiry
```

### `rateLimit(options)` — In-Memory Rate Limiter
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // requests per window
});
// Uses req.ip as key, in-memory Map storage
// Returns 429 with retryAfter when exceeded
```

### API Key Verification Flow
```javascript
// 1. Frontend hashes API_KEY with SHA-256
// 2. Sends hashed value in x-api-key header
// 3. Backend hashes its API_KEY env var with SHA-256
// 4. Compares using crypto.timingSafeEqual (timing-attack safe)

const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};
```

## RBAC Middleware (`src/middleware/rbac.js`)

### Role Hierarchy
```
ROOT (0) → Full access, sees all data
ADMIN (1) → Own structures + assigned structures (via structure_admins)
SUPPORT (2) → Read-all, edit items in assigned structures (not structures themselves)
INVESTOR (3) → Own investments only
GUEST (4) → Read-only everywhere
```

### `requireInvestmentManagerAccess`
Blocks INVESTOR (3) and GUEST (4). Allows ROOT, ADMIN, SUPPORT.

### `requireRootAccess`
Only allows ROOT (0).

### `applyRoleFilter(criteria, userRole, userId, creatorField)`
Modifies query criteria based on role:
- ROOT/SUPPORT/GUEST: returns criteria unchanged
- ADMIN: adds `{ [creatorField]: userId }` filter
- INVESTOR: returns `null` (blocked)

### `filterByRole(items, userRole, userId)`
Post-query filtering of result arrays:
- ROOT/SUPPORT/GUEST: returns all items
- ADMIN: filters by `createdBy` / `created_by` / `userId` / `user_id` / `uploadedBy`
- INVESTOR: returns `[]`

### `canAccessStructure(structure, userRole, userId, StructureAdmin)`
Async check for structure-level access:
```javascript
// ROOT → always true
// GUEST → always true (read-only)
// INVESTOR → always false
// ADMIN → true if creator OR assigned via StructureAdmin.hasAccess()
// SUPPORT → true if assigned via StructureAdmin.hasAccess()
```

### `getUserStructureIds(userRole, userId, StructureAdmin)`
Returns list of accessible structure IDs:
```javascript
// ROOT/GUEST → null (meaning "all")
// INVESTOR → [] (none)
// ADMIN/SUPPORT → [...createdIds, ...assignedIds] (deduplicated)
```

## Typical Route Middleware Chain

```javascript
// Public endpoint
router.post('/login', loginHandler);

// Authenticated user
router.get('/profile', authenticate, profileHandler);

// Admin-only (ROOT + ADMIN + SUPPORT)
router.get('/structures', authenticate, requireInvestmentManagerAccess, listHandler);

// ROOT-only
router.delete('/users/:id', authenticate, requireRootAccess, deleteHandler);

// With rate limiting
router.post('/mfa/verify', authenticate, rateLimit({ max: 5 }), verifyMfaHandler);

// With client key (third-party)
router.post('/portal/wallet', authenticate, validateClientKey, createWalletHandler);
```
