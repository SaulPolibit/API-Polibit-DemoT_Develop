---
title: "Reference: Submission API"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# DocuSeal Submission API Reference

## External API Client (`src/services/apiManager.js`)

All DocuSeal API calls go through the `apiManager` class methods, which handle authentication and error handling.

### Create Submission
```javascript
async createDocuSealSubmission(submissionData) {
  const response = await axios.post(
    `${DOCUSEAL_BASE_URL}/submissions`,
    submissionData,
    {
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

// submissionData shape:
{
  template_id: 123456,
  send_email: true,      // Send signing invitation
  submitters: [
    {
      email: 'signer@example.com',
      name: 'John Doe',
      role: 'Signer',      // Must match template role
      fields: [
        { name: 'full_name', default_value: 'John Doe' },
        { name: 'date', default_value: '2026-03-01' },
        { name: 'amount', default_value: '$100,000' },
      ],
    },
  ],
  message: {              // Optional custom email message
    subject: 'Document ready for signing',
    body: 'Please review and sign the attached document.',
  },
}
```

### Get Submission
```javascript
async getDocuSealSubmission(submissionId) {
  const response = await axios.get(
    `${DOCUSEAL_BASE_URL}/submissions/${submissionId}`,
    { headers: { 'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN } }
  );
  return response.data;
}

// Response shape:
{
  id: 123456,
  template_id: 789,
  status: 'completed',  // 'pending', 'completed', 'expired'
  created_at: '2026-03-01T...',
  completed_at: '2026-03-01T...',
  submitters: [
    {
      id: 1,
      email: 'signer@example.com',
      status: 'completed',
      completed_at: '...',
      documents: [
        { name: 'document.pdf', url: 'https://...' },
      ],
    },
  ],
}
```

### List Submissions
```javascript
async listDocuSealSubmissions(params = {}) {
  const response = await axios.get(
    `${DOCUSEAL_BASE_URL}/submissions`,
    {
      params: {
        limit: params.limit || 20,
        after: params.after,       // Cursor-based pagination
        template_id: params.templateId,
        status: params.status,
      },
      headers: { 'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN },
    }
  );
  return response.data;
}
```

### Get Templates
```javascript
async getDocuSealTemplates() {
  const response = await axios.get(
    `${DOCUSEAL_BASE_URL}/templates`,
    { headers: { 'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN } }
  );
  return response.data;
}
```

## Route Handlers (`src/routes/docuseal.routes.js`)

### List Submissions with Filters
```javascript
// GET /api/docuseal/submissions?status=completed&templateId=123&page=1&limit=20
router.get('/submissions', authenticate, async (req, res) => {
  const { status, templateId, page = 1, limit = 20 } = req.query;
  // Fetches from DocuSeal API with filters
  // Returns paginated results
});
```

### Search Submissions
```javascript
// GET /api/docuseal/submissions/search?q=john@example.com
router.get('/submissions/search', authenticate, async (req, res) => {
  const { q } = req.query;
  // Searches by email, name, or template name
});
```

### Download Signed Documents
```javascript
// GET /api/docuseal/submissions/:submissionId/download
router.get('/submissions/:submissionId/download', authenticate, async (req, res) => {
  // Returns array of download URLs for completed submission documents
  // URLs are temporary (time-limited by DocuSeal)
});
```

### Submission Statistics
```javascript
// GET /api/docuseal/submissions/stats
router.get('/submissions/stats', authenticate, async (req, res) => {
  // Returns: { total, pending, completed, expired }
});
```

### Verify User Signature
```javascript
// GET /api/docuseal/verifyUserSignature?email=user@example.com
router.get('/verifyUserSignature', authenticate, async (req, res) => {
  // Checks if user has any unused/pending DocuSeal submissions
  // Used to determine if user needs to sign documents
});
```

## DB Model (`src/models/supabase/docusealSubmission.js`)

Tracks submissions locally for faster querying and status tracking:

```javascript
// Key fields:
{
  id: uuid,
  submission_id: string,     // DocuSeal submission ID
  template_id: string,       // DocuSeal template ID
  status: string,            // 'pending', 'completed', 'expired'
  signers: jsonb,            // Array of signer info
  structure_id: uuid,        // Related fund structure
  created_by: uuid,          // User who created the submission
  completed_at: timestamptz,
  created_at: timestamptz,
}
```
