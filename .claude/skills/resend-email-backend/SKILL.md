---
name: resend-email-backend
description: "Activate when working with email sending, Resend API, email domains, DNS verification, email logging, or email templates on the backend. Trigger phrases: 'email', 'Resend', 'send email', 'domain', 'DNS', 'email log', 'email sender'. NOT for frontend email UI components or notification system (use supabase-database for notifications)."
---

# Resend Email Backend — Email Service & Domain Management

## Purpose

This skill covers the Resend email integration for transactional email sending with custom domain support. Features include priority-based sender selection (explicit → verified domain → env fallback), domain DNS verification, email logging to the database, and attachment support.

## Architecture

```
src/utils/emailSender.js          → Core email sending utility (304 lines)
src/utils/resendDomains.js        → Domain management utility (236 lines)
src/routes/email.routes.js        → Email sending routes
src/routes/emailDomain.routes.js  → Domain management routes (11KB)
src/models/supabase/emailLog.js   → Email log tracking
src/models/supabase/emailDomain.js → Email domain records
src/models/supabase/emailSettings.js → Per-user email settings
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/emailSender.js` | `sendEmail()` with priority chain, validation, attachment support, logging |
| `src/utils/resendDomains.js` | `createDomain()`, `verifyDomain()`, `deleteDomain()`, `listDomains()`, `getDomainDNS()` |
| `src/routes/email.routes.js` | Email sending endpoints |
| `src/routes/emailDomain.routes.js` | Domain CRUD + DNS verification endpoints |
| `src/models/supabase/emailLog.js` | Email log model (from, to, subject, status, resend_id) |
| `src/models/supabase/emailDomain.js` | Domain model (domain, resend_domain_id, status, dns_records) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for sending emails |
| `RESEND_FROM_EMAIL` | Default fallback sender email address |

## API Endpoints

### Email Sending
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/email/send` | Bearer | Send an email |
| GET | `/api/email/logs` | Bearer | Get email logs |
| GET | `/api/email/test` | Bearer | Test email configuration |

### Domain Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/email-domains` | Bearer | Create/register a new domain |
| GET | `/api/email-domains` | Bearer | List all domains for user |
| GET | `/api/email-domains/:id` | Bearer | Get domain details |
| POST | `/api/email-domains/:id/verify` | Bearer | Trigger DNS verification |
| DELETE | `/api/email-domains/:id` | Bearer | Delete domain |
| GET | `/api/email-domains/:id/dns` | Bearer | Get DNS records for setup |

## Common Tasks

### Send an email
```javascript
const { sendEmail } = require('../utils/emailSender');

await sendEmail({
  to: 'recipient@example.com',
  subject: 'Capital Call Notice',
  html: '<h1>Notice</h1><p>Details...</p>',
  from: 'fund@customdomain.com',  // Optional: uses priority chain if omitted
  cc: ['cc@example.com'],          // Optional
  bcc: ['bcc@example.com'],        // Optional
  replyTo: 'reply@example.com',    // Optional
  attachments: [                    // Optional
    {
      filename: 'notice.pdf',
      content: base64String,        // Base64 encoded
    },
  ],
  structureId: 'uuid',             // Optional: for email log association
  userId: 'uuid',                  // Optional: for email log association
});
```

### Register a custom domain
```javascript
const { createDomain } = require('../utils/resendDomains');
const domain = await createDomain('fund.example.com');
// Returns: { id, name, status: 'pending', records: [...] }
// User must add DNS records then call verifyDomain()
```

### Verify domain DNS
```javascript
const { verifyDomain } = require('../utils/resendDomains');
const result = await verifyDomain(resendDomainId);
// Returns: { status: 'verified' | 'pending' | 'failed' }
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Missing Resend API key" | `RESEND_API_KEY` not set | Add to `.env` |
| Email from unverified domain | Domain DNS not verified | Check DNS records, call verify endpoint |
| Attachments not sending | Wrong base64 format | Ensure content is valid base64 string |
| Domain already exists | Duplicate domain registration | Resend returns error for existing domains |
| Email log not created | DB error during logging | Check Supabase connection; email still sends |

## References

- [Email Sender Implementation](references/email-sender.md)
- [Domain Management](references/domain-management.md)
