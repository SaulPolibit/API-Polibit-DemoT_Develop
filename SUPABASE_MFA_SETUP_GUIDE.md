# Supabase MFA (Multi-Factor Authentication) Setup Guide

Complete guide for setting up and using Multi-Factor Authentication (MFA) with Supabase in your API deployed on Vercel.

---

## Table of Contents

1. [What is MFA and Why Use It?](#what-is-mfa-and-why-use-it)
2. [Part 1: Enable MFA in Supabase Dashboard](#part-1-enable-mfa-in-supabase-dashboard)
3. [Part 2: Your Existing MFA API Endpoints](#part-2-your-existing-mfa-api-endpoints)
4. [Part 3: Complete MFA Flow (Frontend Integration)](#part-3-complete-mfa-flow-frontend-integration)
5. [Part 4: Vercel Serverless Considerations](#part-4-vercel-serverless-considerations)
6. [Part 5: Testing MFA](#part-5-testing-mfa)
7. [Troubleshooting](#troubleshooting)

---

## What is MFA and Why Use It?

**Multi-Factor Authentication (MFA)** adds an extra layer of security by requiring users to provide two forms of verification:
1. **Something they know** - Password
2. **Something they have** - Mobile device with authenticator app (Google Authenticator, Authy, etc.)

**Benefits:**
- Prevents unauthorized access even if password is compromised
- Protects against phishing attacks
- Meets compliance requirements (SOC 2, HIPAA, etc.)
- Increases user trust and security

---

## Part 1: Enable MFA in Supabase Dashboard

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in with your account
3. Select your project: `sredvfzqtzbjmobijjtw` (or the project name you're using)

### Step 2: Navigate to Authentication Settings

1. In the left sidebar, click **Authentication**
2. Click on **Providers** tab
3. Scroll down to find **Multi-Factor Authentication (MFA)** section

### Step 3: Enable MFA

1. Toggle **Enable Multi-Factor Authentication** to ON
2. You'll see these MFA options:
   - **TOTP (Time-based One-Time Password)** - Recommended ✓
     - Works with Google Authenticator, Authy, Microsoft Authenticator
   - **SMS** - Requires phone number (additional setup needed)
   - **Email** - Less secure, not recommended

3. **Enable TOTP** (recommended):
   - Toggle **TOTP** to ON
   - Configure settings:
     - **Require MFA for all users**: OFF (let users opt-in)
     - **Allow users to enroll**: ON ✓
     - **Verification attempts**: 3-5 attempts
     - **Code expiry**: 30 seconds (standard for TOTP)

### Step 4: Configure MFA Policies (Optional)

In **Authentication** → **Policies**, you can set:

- **Enforce MFA for specific roles**: Require MFA for admin/root users
- **Grace period**: Time before MFA is required (e.g., 7 days)
- **Remember device**: Allow users to skip MFA on trusted devices (30 days)

**Recommended Settings:**
```
✓ Allow users to enroll in MFA
✓ TOTP enabled
✓ Allow multiple factors per user
□ Require MFA for all users (let users opt-in)
✓ Allow factor removal
```

### Step 5: Save Settings

Click **Save** at the bottom of the page.

**Note:** MFA settings take effect immediately. No deployment required.

---

## Part 2: Your Existing MFA API Endpoints

Your API already has MFA endpoints implemented at:
- **Base URL:** `/api/custom/`

### Available Endpoints:

#### 1. Login (with MFA support)
```http
POST /api/custom/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Response (No MFA enrolled):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "supabase": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "refreshToken": "v1-Ab3CDeFg..."
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": 3
  }
}
```

**Response (MFA enrolled and required):**
```json
{
  "success": false,
  "mfaRequired": true,
  "message": "MFA verification required",
  "userId": "user-uuid-here",
  "factors": [
    {
      "id": "factor-id",
      "type": "totp",
      "friendlyName": "My Authenticator"
    }
  ]
}
```

---

#### 2. Enroll in MFA
```http
POST /api/custom/mfa/enroll
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "supabaseAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "supabaseRefreshToken": "v1-Ab3CDeFg...",
  "factorType": "totp",
  "friendlyName": "My iPhone Authenticator"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA enrollment initiated successfully",
  "data": {
    "factorId": "factor-uuid",
    "factorType": "totp",
    "qrCode": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0...",
    "secret": "JBSWY3DPEHPK3PXP",
    "uri": "otpauth://totp/YourApp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=YourApp"
  },
  "nextSteps": [
    "1. Open your authenticator app (Google Authenticator, Authy, etc.)",
    "2. Scan the QR code or manually enter the secret",
    "3. Enter the 6-digit code from your app to verify enrollment"
  ]
}
```

**Important:** Save the `factorId` - you'll need it to verify enrollment.

---

#### 3. Verify MFA Code
```http
POST /api/custom/mfa/verify
Content-Type: application/json

{
  "userId": "user-uuid-from-login",
  "code": "123456",
  "factorType": "totp"
}
```

**Response (Successful verification):**
```json
{
  "success": true,
  "message": "MFA verification successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

#### 4. Unenroll from MFA (Remove MFA)
```http
POST /api/custom/mfa/unenroll
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "supabaseAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "supabaseRefreshToken": "v1-Ab3CDeFg...",
  "factorId": "factor-uuid",
  "factorType": "totp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA unenrolled successfully"
}
```

---

## Part 3: Complete MFA Flow (Frontend Integration)

### Flow 1: User Enrolls in MFA (First Time Setup)

```javascript
// Step 1: User logs in normally
const loginResponse = await fetch('/api/custom/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();

// Step 2: User wants to enable MFA (from settings page)
const enrollResponse = await fetch('/api/custom/mfa/enroll', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${loginData.token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supabaseAccessToken: loginData.supabase.accessToken,
    supabaseRefreshToken: loginData.supabase.refreshToken,
    factorType: 'totp',
    friendlyName: 'My Phone'
  })
});

const enrollData = await enrollResponse.json();

// Step 3: Display QR code to user
// enrollData.data.qrCode contains the QR code as SVG base64
// Show this QR code in your UI for user to scan with authenticator app
console.log('QR Code:', enrollData.data.qrCode);
console.log('Manual entry secret:', enrollData.data.secret);

// Step 4: User scans QR code with Google Authenticator/Authy
// User enters the 6-digit code from their app

// Step 5: Verify the code to complete enrollment
const verifyResponse = await fetch('/api/custom/mfa/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: loginData.user.id,
    code: '123456', // 6-digit code from authenticator app
    factorType: 'totp'
  })
});

const verifyData = await verifyResponse.json();
console.log('MFA enrollment complete!', verifyData);
```

---

### Flow 2: User Logs In with MFA Enabled

```javascript
// Step 1: User attempts login
const loginResponse = await fetch('/api/custom/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();

// Step 2: Check if MFA is required
if (loginData.mfaRequired) {
  console.log('MFA verification needed');

  // Show MFA code input to user
  const userCode = prompt('Enter 6-digit code from authenticator app:');

  // Step 3: Verify MFA code
  const mfaResponse = await fetch('/api/custom/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: loginData.userId,
      code: userCode,
      factorType: 'totp'
    })
  });

  const mfaData = await mfaResponse.json();

  if (mfaData.success) {
    // Login successful - use mfaData.token for authenticated requests
    console.log('Login successful with MFA!', mfaData.token);
  } else {
    console.error('Invalid MFA code');
  }
} else {
  // No MFA enabled - login successful
  console.log('Login successful without MFA', loginData.token);
}
```

---

### Flow 3: User Removes MFA

```javascript
// User is logged in and wants to disable MFA
const unenrollResponse = await fetch('/api/custom/mfa/unenroll', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supabaseAccessToken: supabaseAccessToken,
    supabaseRefreshToken: supabaseRefreshToken,
    factorType: 'totp'
  })
});

const unenrollData = await unenrollResponse.json();
console.log('MFA removed successfully', unenrollData);
```

---

## Part 4: Vercel Serverless Considerations

### Important Notes for Vercel Deployment:

#### 1. Stateless Functions
- Vercel functions are stateless - each request is independent
- MFA sessions are handled by Supabase Auth (not your API)
- Your JWT tokens remain valid as they're not session-based

#### 2. Environment Variables

Ensure these are set in **Vercel → Settings → Environment Variables**:

```env
# Supabase
SUPABASE_URL=https://sredvfzqtzbjmobijjtw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your_jwt_secret
```

**Important:** After adding/updating environment variables in Vercel:
1. Go to Vercel dashboard
2. Trigger a new deployment or redeploy
3. Environment variables are only updated on new deployments

#### 3. Cold Starts
- Vercel functions may have cold starts (first request takes longer)
- MFA verification might take 1-2 seconds on cold start
- This is normal - subsequent requests are faster

#### 4. Function Timeout
- Default Vercel timeout: **10 seconds** (Hobby plan) / **60 seconds** (Pro plan)
- MFA operations are fast (< 1 second typically)
- No special configuration needed

#### 5. Database Connection
- Your Supabase client connects via HTTPS (no persistent connections)
- Works perfectly with serverless
- No connection pooling needed

#### 6. Testing Locally vs Production

**Local testing:**
```bash
npm run dev
# or
vercel dev
```

**Production:**
- Deploy to Vercel: `vercel --prod`
- MFA works identically in both environments

---

## Part 5: Testing MFA

### Test Scenario 1: Enroll New User in MFA

**Tools Needed:**
- API client (Postman, cURL, or Thunder Client in VS Code)
- Google Authenticator app on your phone

**Steps:**

1. **Login to get tokens:**
```bash
curl -X POST http://localhost:3005/api/custom/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "saul@polibit.io",
    "password": "yourPassword"
  }'
```

Save the response:
- `token` (JWT)
- `supabase.accessToken`
- `supabase.refreshToken`
- `user.id`

2. **Enroll in MFA:**
```bash
curl -X POST http://localhost:3005/api/custom/mfa/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseAccessToken": "YOUR_SUPABASE_ACCESS_TOKEN",
    "supabaseRefreshToken": "YOUR_SUPABASE_REFRESH_TOKEN",
    "factorType": "totp",
    "friendlyName": "Test Phone"
  }'
```

3. **Scan QR code:**
   - Copy the `qrCode` value from response
   - It's a base64 SVG - decode it or use an online QR decoder
   - Scan with Google Authenticator app
   - OR manually enter the `secret` value in your authenticator app

4. **Verify enrollment:**
```bash
curl -X POST http://localhost:3005/api/custom/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "code": "123456",
    "factorType": "totp"
  }'
```

Replace `123456` with the 6-digit code from your authenticator app.

---

### Test Scenario 2: Login with MFA

**Steps:**

1. **Attempt login:**
```bash
curl -X POST http://localhost:3005/api/custom/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "saul@polibit.io",
    "password": "yourPassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "mfaRequired": true,
  "message": "MFA verification required",
  "userId": "user-uuid",
  "factors": [...]
}
```

2. **Verify MFA:**
```bash
curl -X POST http://localhost:3005/api/custom/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-from-previous-response",
    "code": "123456",
    "factorType": "totp"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "MFA verification successful",
  "token": "jwt-token-here",
  "user": {...}
}
```

---

### Test Scenario 3: Remove MFA

```bash
curl -X POST http://localhost:3005/api/custom/mfa/unenroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseAccessToken": "YOUR_SUPABASE_ACCESS_TOKEN",
    "supabaseRefreshToken": "YOUR_SUPABASE_REFRESH_TOKEN",
    "factorType": "totp"
  }'
```

---

## Troubleshooting

### Problem: "Invalid or expired Supabase session"

**Cause:** Supabase tokens expired (24-hour expiry)

**Solution:**
1. Login again to get fresh tokens
2. Use the new `supabase.accessToken` and `supabase.refreshToken`

---

### Problem: "MFA verification failed - Invalid code"

**Causes:**
1. Time sync issue on phone
2. Wrong code entered
3. Code expired (30-second window)

**Solutions:**
1. Check phone time is set to automatic (Settings → Date & Time → Automatic)
2. Try the next code that appears in authenticator app
3. Ensure you're using the correct account in authenticator app

---

### Problem: QR code not scanning

**Solutions:**
1. Use manual entry instead - enter the `secret` value in authenticator app
2. Check QR code is displaying correctly (base64 SVG decoding)
3. Increase screen brightness
4. Try different authenticator app (Google Authenticator vs Authy)

---

### Problem: "User already enrolled in MFA"

**Cause:** User already has MFA factor enrolled

**Solution:**
1. Unenroll first using `/api/custom/mfa/unenroll`
2. Then enroll again
3. Or check existing factors in Supabase dashboard

---

### Problem: MFA works locally but not on Vercel

**Causes:**
1. Environment variables not set in Vercel
2. Old deployment cached

**Solutions:**
1. Check Vercel → Settings → Environment Variables
2. Verify all Supabase keys are present
3. Trigger new deployment: `vercel --prod --force`
4. Clear Vercel edge cache

---

### Problem: "Factor not found"

**Cause:** MFA factor was deleted or doesn't exist

**Solution:**
1. Check factors in Supabase dashboard: Authentication → Users → [User] → Factors
2. Re-enroll if factor was deleted
3. Verify correct `factorId` is being used

---

## Security Best Practices

### 1. Enforce MFA for Privileged Accounts

In your user registration/update logic, enforce MFA for:
- Root users (role: 0)
- Admin users (role: 1)

```javascript
// Example: Check if user should have MFA
if (user.role === 0 || user.role === 1) {
  // Require MFA enrollment within 7 days
  if (!user.hasMFA && daysSinceRegistration > 7) {
    return res.status(403).json({
      success: false,
      message: 'MFA enrollment required for admin accounts',
      requireMFA: true
    });
  }
}
```

### 2. Backup Codes

Consider implementing backup codes for account recovery:
- Generate 10 single-use backup codes during MFA enrollment
- Store them hashed in database
- Allow users to download/print them

### 3. Rate Limiting

Add rate limiting to MFA verify endpoint:
- Max 5 attempts per 15 minutes
- Block IP after 10 failed attempts
- Already have `rateLimit` middleware in `src/middleware/auth.js`

```javascript
// In custom.routes.js
const { rateLimit } = require('../middleware/auth');

router.post('/mfa/verify',
  rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }),
  catchAsync(async (req, res) => {
    // ... existing code
  })
);
```

### 4. Audit Logs

Log all MFA events:
- Enrollment attempts
- Successful/failed verifications
- Unenrollment
- Factor changes

### 5. Session Management

Consider implementing "remember this device" feature:
- Issue long-lived device tokens (30 days)
- Skip MFA on trusted devices
- Revoke device tokens on password change

---

## Additional Resources

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
- [Google Authenticator Setup](https://support.google.com/accounts/answer/1066447)
- [Authy App](https://authy.com/download/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## Quick Reference

### Authenticator Apps (Recommended)
- **Google Authenticator** - iOS/Android - Free
- **Authy** - iOS/Android/Desktop - Free
- **Microsoft Authenticator** - iOS/Android - Free
- **1Password** - Paid, all platforms

### MFA Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/custom/login` | POST | No | Login with MFA support |
| `/api/custom/mfa/enroll` | POST | Yes (JWT) | Start MFA enrollment |
| `/api/custom/mfa/verify` | POST | No | Verify MFA code |
| `/api/custom/mfa/unenroll` | POST | Yes (JWT) | Remove MFA |

### Environment Variables Checklist

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET`
- [ ] All set in Vercel dashboard
- [ ] Redeployed after setting variables

---

**Last Updated:** December 24, 2025
**API Version:** v1
**Supabase Auth Version:** Latest
