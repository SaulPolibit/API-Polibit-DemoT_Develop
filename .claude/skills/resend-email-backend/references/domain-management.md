---
title: "Reference: Domain Management"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Domain Management

## Module: `src/utils/resendDomains.js`

Manages custom email domains via the Resend API. Allows fund managers to send emails from their own domain (e.g., `notices@fund.example.com`).

### Lazy Client Initialization

```javascript
const { Resend } = require('resend');

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
```

### Create Domain

```javascript
async function createDomain(domainName) {
  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domainName)) {
    throw new Error('Invalid domain format');
  }

  const resend = getResendClient();
  const { data, error } = await resend.domains.create({ name: domainName });

  if (error) {
    // Handle duplicate domain
    if (error.message?.includes('already exists')) {
      throw new Error(`Domain ${domainName} is already registered`);
    }
    throw error;
  }

  return {
    id: data.id,           // Resend domain ID
    name: data.name,       // Domain name
    status: data.status,   // 'pending' | 'verified'
    records: data.records, // DNS records to add
  };
}
```

### Verify Domain

```javascript
async function verifyDomain(domainId) {
  const resend = getResendClient();
  const { data, error } = await resend.domains.verify(domainId);

  if (error) throw error;

  return {
    id: data.id,
    status: data.status, // 'verified' | 'pending' | 'failed'
  };
}
```

### Get Domain Details

```javascript
async function getDomain(domainId) {
  const resend = getResendClient();
  const { data, error } = await resend.domains.get(domainId);
  if (error) throw error;
  return data;
}
```

### List Domains

```javascript
async function listDomains() {
  const resend = getResendClient();
  const { data, error } = await resend.domains.list();
  if (error) throw error;
  return data.data; // Array of domain objects
}
```

### Delete Domain

```javascript
async function deleteDomain(domainId) {
  const resend = getResendClient();
  const { data, error } = await resend.domains.remove(domainId);
  if (error) throw error;
  return data;
}
```

### Get DNS Records

```javascript
async function getDomainDNS(domainId) {
  const domain = await getDomain(domainId);

  // Format DNS records for user display
  return domain.records.map(record => ({
    type: record.type,     // 'MX', 'TXT', 'CNAME'
    name: record.name,     // Record name
    value: record.value,   // Record value
    priority: record.priority, // MX priority (if applicable)
    status: record.status, // 'verified' | 'pending'
  }));
}
```

## Route Handlers (`src/routes/emailDomain.routes.js`)

### Create Domain
```javascript
// POST /api/email-domains
// Body: { domain: 'fund.example.com' }
// 1. Validate domain format
// 2. Create in Resend API
// 3. Save to email_domains table with DNS records
// 4. Return domain with DNS setup instructions
```

### Verify Domain
```javascript
// POST /api/email-domains/:id/verify
// 1. Get domain from DB
// 2. Call Resend verify API
// 3. Update status in DB
// 4. If verified, clear domain cache in emailSender
```

### Get DNS Records
```javascript
// GET /api/email-domains/:id/dns
// Returns formatted DNS records user needs to add:
// [
//   { type: 'MX', name: 'fund.example.com', value: 'feedback-smtp.us-east-1...', priority: 10 },
//   { type: 'TXT', name: 'fund.example.com', value: 'v=spf1 include:amazonses.com ~all' },
//   { type: 'CNAME', name: 'resend._domainkey.fund.example.com', value: '...' },
// ]
```

## DB Model (`src/models/supabase/emailDomain.js`)

```javascript
// Key fields:
{
  id: uuid,
  domain: string,             // 'fund.example.com'
  resend_domain_id: string,   // Resend's internal ID
  status: string,             // 'pending', 'verified', 'failed'
  dns_records: jsonb,         // Array of DNS records from Resend
  user_id: uuid,              // Owner of this domain
  created_at: timestamptz,
  updated_at: timestamptz,
}
```

## Domain Verification Flow

```
1. User creates domain → POST /api/email-domains
   └── Resend returns DNS records to configure

2. User adds DNS records to their DNS provider
   └── MX, TXT (SPF), CNAME (DKIM)

3. User triggers verification → POST /api/email-domains/:id/verify
   └── Resend checks DNS propagation

4. If verified → status: 'verified'
   └── Emails can now be sent from noreply@domain.com
   └── Domain config cached for 5 minutes in emailSender

5. If not yet propagated → status: 'pending'
   └── User retries verification later
```

## Exported Functions

```javascript
module.exports = {
  createDomain,
  verifyDomain,
  getDomain,
  listDomains,
  deleteDomain,
  getDomainDNS,
};
```
