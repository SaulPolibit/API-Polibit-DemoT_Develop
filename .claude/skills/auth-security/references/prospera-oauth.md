---
title: "Reference: Prospera OAuth Flow"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Prospera OAuth2/OIDC Flow

## Overview

eProspera uses OAuth 2.0 with OpenID Connect (OIDC) and PKCE (Proof Key for Code Exchange) for authentication. The service is implemented as a singleton in `src/services/prospera.service.js`.

## Environment Configuration

```bash
EPROSPERA_CLIENT_ID=your_client_id
EPROSPERA_CLIENT_SECRET=your_client_secret
# Staging:
EPROSPERA_ISSUER_URL=https://staging-portal.eprospera.com
# Production:
EPROSPERA_ISSUER_URL=https://portal.eprospera.com
```

## Service Architecture

```javascript
// Singleton pattern
class ProsperoService {
  constructor() {
    this.client = null;        // OpenID Connect client
    this.issuer = null;        // OIDC issuer metadata
    this.initialized = false;
  }

  // Lazy initialization via OIDC discovery
  async initialize() {
    const { Issuer } = require('openid-client');
    this.issuer = await Issuer.discover(process.env.EPROSPERA_ISSUER_URL);
    this.client = new this.issuer.Client({
      client_id: process.env.EPROSPERA_CLIENT_ID,
      client_secret: process.env.EPROSPERA_CLIENT_SECRET,
      redirect_uris: [`${process.env.FRONTEND_URL}/auth/prospera/callback`],
      response_types: ['code'],
    });
  }
}

module.exports = new ProsperoService();
```

## Complete OAuth Flow

### Step 1: Generate Authorization URL
```javascript
// GET /api/auth/prospera/authorize
async getAuthorizationUrl() {
  await this.ensureInitialized();

  // Generate PKCE code verifier and challenge
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  const authUrl = this.client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: generators.state(),
  });

  return { authUrl, codeVerifier, state };
  // Frontend stores codeVerifier in session/localStorage
}
```

### Step 2: Exchange Authorization Code
```javascript
// POST /api/auth/prospera/callback
// Body: { code, codeVerifier, state }
async exchangeCode(code, codeVerifier, redirectUri) {
  await this.ensureInitialized();

  const tokenSet = await this.client.callback(redirectUri, { code }, {
    code_verifier: codeVerifier,
  });

  return {
    accessToken: tokenSet.access_token,
    refreshToken: tokenSet.refresh_token,
    idToken: tokenSet.id_token,
    expiresAt: tokenSet.expires_at,
  };
}
```

### Step 3: Get User Profile
```javascript
async getUserProfile(accessToken) {
  await this.ensureInitialized();
  const userinfo = await this.client.userinfo(accessToken);

  return {
    sub: userinfo.sub,
    email: userinfo.email,
    firstName: userinfo.given_name,
    lastName: userinfo.family_name,
    rpn: userinfo.rpn,  // Resident Permit Number
  };
}
```

### Step 4: Verify RPN
```javascript
async verifyRPN(rpn) {
  // Calls eProspera API to verify Resident Permit Number
  // Used to confirm user identity for compliance
  const response = await axios.get(
    `${process.env.EPROSPERA_ISSUER_URL}/api/verify-rpn/${rpn}`,
    { headers: { 'Authorization': `Bearer ${process.env.EPROSPERA_API_KEY}` } }
  );
  return response.data;
}
```

### Step 5: Refresh Token
```javascript
async refreshToken(refreshToken) {
  await this.ensureInitialized();
  const tokenSet = await this.client.refresh(refreshToken);
  return {
    accessToken: tokenSet.access_token,
    refreshToken: tokenSet.refresh_token,
    expiresAt: tokenSet.expires_at,
  };
}
```

## Sequence Diagram

```
Frontend                    Backend                     eProspera
   │                          │                            │
   │ GET /auth/prospera/auth  │                            │
   │─────────────────────────>│                            │
   │                          │  OIDC Discovery            │
   │                          │───────────────────────────>│
   │                          │<───────────────────────────│
   │  { authUrl, state }      │                            │
   │<─────────────────────────│                            │
   │                          │                            │
   │ Redirect to authUrl      │                            │
   │──────────────────────────────────────────────────────>│
   │                          │                            │
   │ Callback with code+state │                            │
   │<──────────────────────────────────────────────────────│
   │                          │                            │
   │ POST /auth/prospera/cb   │                            │
   │ { code, codeVerifier }   │                            │
   │─────────────────────────>│  Exchange code             │
   │                          │───────────────────────────>│
   │                          │  { tokens }                │
   │                          │<───────────────────────────│
   │                          │  Get userinfo              │
   │                          │───────────────────────────>│
   │                          │  { profile + RPN }         │
   │                          │<───────────────────────────│
   │  { jwt, user }           │                            │
   │<─────────────────────────│                            │
```

## DiDit KYC Integration

DiDit is used for identity verification (KYC), managed server-side:

```javascript
// Create KYC session
const session = await apiManager.createDiditSession({
  workflow_id: process.env.DIDIT_WORKFLOW_ID,
  vendor_data: 'Polibit',
  callback: process.env.DIDIT_CALLBACK_URL,
});

// Check verification status
const status = await apiManager.getDiditVerification(sessionId);
// Returns: { status: 'approved' | 'declined' | 'pending', ... }
```

## Key Constants

```javascript
// From src/config/constants.js
DIDIT_AUTH_URL: 'https://apx.didit.me/auth/v2'
DIDIT_VERIFICATION_URL: 'https://verification.didit.me/v1'
```
