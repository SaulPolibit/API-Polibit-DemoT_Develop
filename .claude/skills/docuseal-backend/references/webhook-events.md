---
title: "Reference: Webhook Events"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# DocuSeal Webhook Events

## Webhook Endpoint

```
POST /api/docuseal/webhook
```

This endpoint receives webhook events from DocuSeal when submission status changes occur.

## Signature Validation

```javascript
router.post('/webhook', async (req, res) => {
  // Validate webhook signature
  const signature = req.headers['x-polibit-signature'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Verify signature against expected value
  // This ensures the webhook is genuinely from DocuSeal/Polibit
  const expectedSignature = process.env.DOCUSEAL_API_TOKEN;
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;
  // Process event...
});
```

## Event Types

### `submission.created`
Fired when a new submission is created and sent to signers.

```json
{
  "event_type": "submission.created",
  "timestamp": "2026-03-01T12:00:00Z",
  "data": {
    "id": 123456,
    "template_id": 789,
    "status": "pending",
    "created_at": "2026-03-01T12:00:00Z",
    "submitters": [
      {
        "id": 1,
        "email": "signer@example.com",
        "name": "John Doe",
        "role": "Signer",
        "status": "pending",
        "sent_at": "2026-03-01T12:00:00Z"
      }
    ]
  }
}
```

**Handler Action:**
- Create/update `docuseal_submissions` record in Supabase
- Set status to `pending`
- Log the submission creation

### `submission.completed`
Fired when all signers have completed signing.

```json
{
  "event_type": "submission.completed",
  "timestamp": "2026-03-01T14:30:00Z",
  "data": {
    "id": 123456,
    "template_id": 789,
    "status": "completed",
    "completed_at": "2026-03-01T14:30:00Z",
    "submitters": [
      {
        "id": 1,
        "email": "signer@example.com",
        "name": "John Doe",
        "role": "Signer",
        "status": "completed",
        "completed_at": "2026-03-01T14:30:00Z",
        "documents": [
          {
            "name": "Investment_Agreement.pdf",
            "url": "https://api.docuseal.com/..."
          }
        ]
      }
    ]
  }
}
```

**Handler Action:**
- Update `docuseal_submissions` record status to `completed`
- Set `completed_at` timestamp
- Optionally trigger notifications to the submission creator
- Store document download URLs for reference

## Webhook Handler Implementation

```javascript
router.post('/webhook', async (req, res) => {
  try {
    // 1. Validate signature
    const signature = req.headers['x-polibit-signature'];
    if (!isValidSignature(signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event_type, data } = req.body;

    // 2. Process by event type
    switch (event_type) {
      case 'submission.created':
        await handleSubmissionCreated(data);
        break;

      case 'submission.completed':
        await handleSubmissionCompleted(data);
        break;

      default:
        console.log(`Unhandled DocuSeal event: ${event_type}`);
    }

    // 3. Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('DocuSeal webhook error:', error);
    // Still return 200 to prevent retries for processing errors
    res.status(200).json({ received: true, error: error.message });
  }
});

async function handleSubmissionCreated(data) {
  const DocusealSubmission = require('../models/supabase').DocusealSubmission;
  await DocusealSubmission.create({
    submissionId: data.id.toString(),
    templateId: data.template_id.toString(),
    status: 'pending',
    signers: data.submitters,
  });
}

async function handleSubmissionCompleted(data) {
  const DocusealSubmission = require('../models/supabase').DocusealSubmission;
  await DocusealSubmission.findByIdAndUpdate(data.id.toString(), {
    status: 'completed',
    completedAt: data.completed_at,
  });
}
```

## Webhook Configuration

To set up the webhook in DocuSeal:
1. Go to DocuSeal dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-api-domain.com/api/docuseal/webhook`
3. Set the `x-polibit-signature` header value
4. Select events: `submission.created`, `submission.completed`

## Error Handling

- Always return `200 OK` to DocuSeal to acknowledge receipt
- Log errors internally but don't expose them in the response
- DocuSeal will retry failed webhooks (non-2xx responses)
- Idempotent handling: check if submission already exists before creating
