---
name: auth-security
description: "Activate when working with authentication, authorization, RBAC roles, JWT tokens, API keys, MFA/TOTP, Prospera OAuth, DiDit KYC, or security middleware. Trigger phrases: 'auth', 'login', 'JWT', 'token', 'role', 'RBAC', 'MFA', 'Prospera', 'KYC', 'DiDit', 'middleware'. NOT for Stripe payment auth or blockchain wallet signing."
---

# Auth & Security — Authentication, RBAC, MFA & OAuth

## Purpose

This skill covers the full authentication and authorization stack: JWT-based authentication, SHA-256 API key verification, role-based access control (RBAC) with 5 roles, TOTP-based MFA via Supabase, Prospera OAuth2/OIDC integration with PKCE, and DiDit KYC verification.

## Architecture

```
src/middleware/auth.js           → JWT verification, API key auth, rate limiting
src/middleware/rbac.js           → Role-based access control (5 roles)
src/services/prospera.service.js → OAuth2/OIDC with PKCE for eProspera
src/models/supabase/mfaFactor.js → MFA TOTP factor management
src/models/supabase/kycSession.js → DiDit KYC session tracking
src/config/constants.js          → External API URLs (DiDit, eProspera)
```

**Auth Flow:** Request → `authenticate` middleware (Bearer JWT or x-api-key) → `requireRole` / RBAC middleware → Route handler

**Two Auth Methods:**
1. **Bearer JWT** — 24-hour tokens via `createToken()`, decoded payload attached to `req.user`
2. **API Key** — SHA-256 hashed `x-api-key` header, timing-safe comparison via `crypto.timingSafeEqual`

## Key Files

| File | Purpose |
|------|---------|
| `src/middleware/auth.js` | `authenticate`, `requireRole`, `createToken`, `rateLimit`, `requireApiKey`, `requireBearerToken`, `validateClientKey` |
| `src/middleware/rbac.js` | `ROLES`, `requireInvestmentManagerAccess`, `requireRootAccess`, `applyRoleFilter`, `filterByRole`, `canEdit`, `canDelete`, `canCreate`, `getUserContext`, `canAccessStructure`, `canEditStructure`, `getUserStructureIds` |
| `src/services/prospera.service.js` | OAuth2 client init, authorization URL, code exchange, token refresh, RPN verification |
| `src/models/supabase/mfaFactor.js` | MFA factor CRUD (factor_id, user_id, status) |
| `src/models/supabase/kycSession.js` | KYC session CRUD (session_id, user_id, status) |
| `src/config/constants.js` | `DIDIT_AUTH_URL`, `DIDIT_VERIFICATION_URL`, eProspera URLs |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing key (24-hour token expiry) |
| `API_KEY` | Backend API key (compared via SHA-256 hash) |
| `ENCRYPTION_KEY` | 32-character encryption key for sensitive data |
| `FRONTEND_URL` | Frontend URL for OAuth redirect URIs |
| `EPROSPERA_CLIENT_ID` | eProspera OAuth client ID |
| `EPROSPERA_CLIENT_SECRET` | eProspera OAuth client secret |
| `EPROSPERA_ISSUER_URL` | eProspera OIDC issuer (`staging-portal.eprospera.com` / `portal.eprospera.com`) |
| `DIDIT_API_KEY` | DiDit KYC API key |
| `DIDIT_WORKFLOW_ID` | DiDit KYC workflow identifier |
| `DIDIT_CALLBACK_URL` | DiDit webhook callback URL |

## RBAC Roles

| Role | Value | Permissions |
|------|-------|-------------|
| ROOT | 0 | Full access to everything |
| ADMIN | 1 | Create/edit/delete own structures + assigned structures (via `structure_admins`) |
| SUPPORT | 2 | Read-only + edit items within assigned structures (NOT structures themselves) |
| INVESTOR | 3 | Create/edit/read own investments only |
| GUEST | 4 | Read-only access to all visible data |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Login with email/password, returns JWT |
| POST | `/api/auth/register` | None | Register new user |
| GET | `/api/auth/prospera/authorize` | None | Get Prospera OAuth authorization URL |
| POST | `/api/auth/prospera/callback` | None | Exchange Prospera auth code for tokens |
| POST | `/api/kyc-sessions` | Bearer | Create DiDit KYC session |
| GET | `/api/kyc-sessions/:id` | Bearer | Get KYC session status |

## Common Tasks

### Add a new protected route
```javascript
const { authenticate } = require('../middleware/auth');
const { requireInvestmentManagerAccess } = require('../middleware/rbac');

router.get('/admin-only', authenticate, requireInvestmentManagerAccess, handler);
```

### Check structure access in a route handler
```javascript
const { getUserContext, canAccessStructure } = require('../middleware/rbac');
const { StructureAdmin } = require('../models/supabase');

const { userId, userRole } = getUserContext(req);
const hasAccess = await canAccessStructure(structure, userRole, userId, StructureAdmin);
```

### Rate-limit an endpoint
```javascript
const { rateLimit } = require('../middleware/auth');
router.post('/sensitive', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), handler);
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid or expired token" | JWT expired (>24h) or wrong secret | Re-login or check `JWT_SECRET` matches |
| "Invalid API key" | SHA-256 hash mismatch | Ensure frontend hashes with same algo, check `API_KEY` env var |
| 403 on admin endpoint | User role too low | Check `req.user.role` value and required role |
| Prospera callback fails | PKCE verifier mismatch or expired | Ensure session stores code_verifier; check OIDC issuer URL |
| MFA rate limit hit | >5 attempts in 15min window | Wait for rate limit window to expire |

## References

- [Middleware Chain Documentation](references/middleware-chain.md)
- [Prospera OAuth Flow](references/prospera-oauth.md)
