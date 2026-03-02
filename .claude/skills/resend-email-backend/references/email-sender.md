---
title: "Reference: Email Sender Implementation"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Email Sender Implementation

## Module: `src/utils/emailSender.js`

### Sender Priority Chain

The `sendEmail()` function determines the `from` address using a priority chain:

```
1. Explicit `from` parameter (highest priority)
   ↓ if not provided
2. Verified domain from database (for the user's structure)
   ↓ if not found or not verified
3. RESEND_FROM_EMAIL environment variable (fallback)
```

### Implementation

```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(options) {
  const {
    to,
    subject,
    html,
    text,
    from,
    cc,
    bcc,
    replyTo,
    attachments,
    structureId,
    userId,
  } = options;

  // Validate required fields
  if (!to || !subject || (!html && !text)) {
    throw new Error('Missing required email fields: to, subject, and html or text');
  }

  // Determine sender address (priority chain)
  let senderEmail = from;

  if (!senderEmail) {
    // Try to get verified domain from cache/database
    senderEmail = await getVerifiedDomainEmail(structureId, userId);
  }

  if (!senderEmail) {
    // Fallback to environment variable
    senderEmail = process.env.RESEND_FROM_EMAIL;
  }

  if (!senderEmail) {
    throw new Error('No sender email configured');
  }

  // Process attachments (convert base64 to Buffer)
  const processedAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: Buffer.from(att.content, 'base64'),
  }));

  // Send via Resend
  const { data, error } = await resend.emails.send({
    from: senderEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    cc,
    bcc,
    reply_to: replyTo,
    attachments: processedAttachments,
  });

  if (error) {
    // Log failure
    await logEmail({ from: senderEmail, to, subject, status: 'failed', error: error.message, structureId });
    throw error;
  }

  // Log success
  await logEmail({
    from: senderEmail,
    to,
    subject,
    status: 'sent',
    resendId: data.id,
    structureId,
  });

  return data;
}
```

### Domain Configuration Cache

```javascript
// 5-minute cache for domain configurations
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getVerifiedDomainEmail(structureId, userId) {
  const cacheKey = `${structureId || ''}_${userId || ''}`;

  // Check cache
  const cached = domainCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.email;
  }

  // Query database for verified domain
  const EmailDomain = require('../models/supabase').EmailDomain;
  const domains = await EmailDomain.find({
    userId,
    status: 'verified',
  });

  if (domains.length > 0) {
    const email = `noreply@${domains[0].domain}`;
    domainCache.set(cacheKey, { email, timestamp: Date.now() });
    return email;
  }

  return null;
}
```

### Email Validation

```javascript
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Email Logging

```javascript
async function logEmail({ from, to, subject, status, resendId, error, structureId }) {
  try {
    const EmailLog = require('../models/supabase').EmailLog;
    await EmailLog.create({
      fromEmail: from,
      toEmail: Array.isArray(to) ? to.join(', ') : to,
      subject,
      status,       // 'sent' or 'failed'
      resendId,     // Resend message ID (for tracking)
      errorMessage: error,
      structureId,
    });
  } catch (logError) {
    // Don't fail the email send if logging fails
    console.error('Failed to log email:', logError.message);
  }
}
```

### Test Connection

```javascript
async function testEmailConnection() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Verify API key by listing domains
    await resend.domains.list();
    return { success: true, message: 'Resend connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

### Exported Functions

```javascript
module.exports = {
  sendEmail,
  testEmailConnection,
  isValidEmail,
};
```
