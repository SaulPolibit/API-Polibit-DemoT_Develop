---
name: docuseal-backend
description: "Activate when working with DocuSeal document signing, submission management, template operations, or signing webhooks on the backend. Trigger phrases: 'DocuSeal', 'document signing', 'submission', 'template', 'e-signature', 'webhook docuseal'. NOT for frontend DocuSeal embedding or PDF report generation (use report-generation)."
---

# DocuSeal Backend — Document Signing (Server-Side)

## Purpose

This skill covers the server-side DocuSeal integration for document signing workflows. Includes submission CRUD, template management, webhook handling for signature events, and user signature verification.

## Architecture

```
src/routes/docuseal.routes.js         → 758 lines — 12+ routes for submissions
src/services/apiManager.js            → DocuSeal API methods (within larger file)
src/models/supabase/docusealSubmission.js → Submission tracking in DB
```

**External API:** `https://api.docuseal.com` (defined in `src/config/constants.js` as `DOCUSEAL_BASE_URL`)

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/docuseal.routes.js` | All submission routes, webhook handler, verification endpoints |
| `src/services/apiManager.js` | `createDocuSealSubmission`, `getDocuSealSubmission`, `listDocuSealSubmissions`, `getDocuSealTemplates` |
| `src/models/supabase/docusealSubmission.js` | Submission state tracking (submission_id, template_id, status, signers) |
| `src/config/constants.js` | `DOCUSEAL_BASE_URL: 'https://api.docuseal.com'` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DOCUSEAL_API_TOKEN` | Primary DocuSeal API token |
| `APITokenDS` | Alternative/legacy DocuSeal token |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/docuseal/submissions/:submissionId` | Bearer | Get submission by ID |
| DELETE | `/api/docuseal/submissions/:submissionId` | Bearer | Delete submission |
| GET | `/api/docuseal/submissions` | Bearer | List all submissions (paginated, filtered) |
| GET | `/api/docuseal/submissions/search` | Bearer | Search submissions by query |
| GET | `/api/docuseal/submissions/template/:templateId` | Bearer | Get submissions for a template |
| GET | `/api/docuseal/submissions/:submissionId/status` | Bearer | Get submission status |
| GET | `/api/docuseal/submissions/:submissionId/download` | Bearer | Get download URLs for signed docs |
| POST | `/api/docuseal/submissions/:submissionId/resend` | Bearer | Resend signing notification |
| GET | `/api/docuseal/submissions/stats` | Bearer | Get submission statistics |
| GET | `/api/docuseal/verifyUserSignature` | Bearer | Check if user has unused submissions |
| GET | `/api/docuseal/my-submissions` | Bearer | Get current user's submissions |
| GET | `/api/docuseal/verify-submission` | Bearer | Verify if user has any submissions |
| POST | `/api/docuseal/webhook` | Signature | Handle DocuSeal webhook events |
| GET | `/api/docuseal/health` | None | Health check |

## Common Tasks

### Create a submission via API
```javascript
const apiManager = require('../services/apiManager');
const submission = await apiManager.createDocuSealSubmission({
  template_id: templateId,
  send_email: true,
  submitters: [
    {
      email: signerEmail,
      name: signerName,
      role: 'Signer',
      fields: [
        { name: 'field_name', default_value: 'value' },
      ],
    },
  ],
});
```

### Query submissions with filters
```javascript
// GET /api/docuseal/submissions?status=completed&templateId=123&page=1&limit=20
```

### Handle webhook events
```javascript
// POST /api/docuseal/webhook
// Validates x-polibit-signature header
// Events: submission.created, submission.completed
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 from DocuSeal API | Invalid API token | Check `DOCUSEAL_API_TOKEN` env var |
| Webhook not received | Wrong callback URL or no signature validation | Verify webhook URL and `x-polibit-signature` header validation |
| Submission not found | Deleted or wrong ID | Check DocuSeal dashboard; verify submission_id format |
| Download URLs expired | DocuSeal URLs are temporary | Re-fetch download URLs via the download endpoint |

## References

- [Submission API Reference](references/submission-api.md)
- [Webhook Events](references/webhook-events.md)
