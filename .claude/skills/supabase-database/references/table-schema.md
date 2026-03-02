---
title: "Reference: Table Schema"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Table Schema Reference

All tables use UUID primary keys (`id`), auto-generated `created_at`, and `updated_at` timestamps. Schema SQL lives in `docs/supabase-schema.sql`.

## Core Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| email | text | Unique, lowercase |
| password | text | bcrypt hashed |
| first_name | text | |
| last_name | text | |
| role | integer | 0=ROOT, 1=ADMIN, 2=SUPPORT, 3=INVESTOR, 4=GUEST |
| is_active | boolean | Default: true |
| is_email_verified | boolean | Default: false |
| profile_image | text | URL |
| app_language | text | Default: 'en' |
| last_login | timestamptz | |
| password_reset_token | text | |
| password_reset_expires | timestamptz | |
| email_verification_token | text | |
| email_verification_expires | timestamptz | |
| prospera_rpn | text | eProspera Resident Permit Number |
| stripe_customer_id | text | Stripe customer reference |
| stripe_connect_account_id | text | Stripe Connect Express account |
| mfa_enabled | boolean | Default: false |
| kyc_status | text | DiDit KYC status |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### companies
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| tax_id | text | |
| address | jsonb | |
| created_by | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

## Investment Manager Tables

### structures
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | Fund/structure name |
| type | text | e.g., 'fund', 'spv' |
| currency | text | Default: 'USD' |
| target_size | numeric | |
| management_fee_rate | numeric | |
| carry_rate | numeric | |
| preferred_return | numeric | |
| status | text | 'active', 'closed', etc. |
| created_by | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

### structure_admins
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| user_id | uuid (FK → users) | |
| role | text | Admin role within structure |
| created_at | timestamptz | |

### structure_investors
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| user_id | uuid (FK → users) | |
| commitment_amount | numeric | |
| status | text | |
| created_at / updated_at | timestamptz | |

### investments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| investor_id | uuid (FK → users) | |
| amount | numeric | |
| status | text | |
| created_at / updated_at | timestamptz | |

### capital_calls
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| call_number | integer | |
| total_amount | numeric | |
| due_date | date | |
| status | text | 'draft', 'sent', 'completed' |
| created_by | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

### capital_call_allocations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| capital_call_id | uuid (FK → capital_calls) | |
| investor_id | uuid (FK → users) | |
| amount | numeric | |
| status | text | 'pending', 'paid', 'overdue' |
| created_at / updated_at | timestamptz | |

### distributions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| total_amount | numeric | |
| distribution_date | date | |
| type | text | |
| status | text | |
| created_by | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

### distribution_allocations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| distribution_id | uuid (FK → distributions) | |
| investor_id | uuid (FK → users) | |
| amount | numeric | |
| created_at / updated_at | timestamptz | |

### waterfall_tiers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| structure_id | uuid (FK → structures) | |
| tier_order | integer | |
| type | text | |
| rate | numeric | |
| created_at / updated_at | timestamptz | |

## Chat System Tables

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | Optional group name |
| type | text | 'direct', 'group' |
| created_by | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

### conversation_participants
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK) | |
| user_id | uuid (FK) | |
| joined_at | timestamptz | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK) | |
| sender_id | uuid (FK → users) | |
| content | text | |
| type | text | 'text', 'file', 'system' |
| created_at | timestamptz | |

### message_attachments / message_reads
Track file attachments and read receipts for messages.

## Email System Tables

### email_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| from_email | text | |
| to_email | text | |
| subject | text | |
| status | text | 'sent', 'failed' |
| resend_id | text | Resend API message ID |
| structure_id | uuid (FK) | Optional |
| created_at | timestamptz | |

### email_domains
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| domain | text | e.g., 'fund.example.com' |
| resend_domain_id | text | |
| status | text | 'pending', 'verified' |
| dns_records | jsonb | DNS verification records |
| user_id | uuid (FK → users) | |
| created_at / updated_at | timestamptz | |

## Other Tables

### documents
Document metadata with storage references.

### docuseal_submissions
DocuSeal signing submission tracking (submission_id, template_id, status, signers).

### payments
Payment records (amount, currency, method, status, structure_id, investor_id).

### subscriptions
Stripe subscription tracking (stripe_subscription_id, plan, status, user_id).

### notifications
User notifications (type, title, message, is_read, user_id, structure_id).

### presence
Real-time user presence (user_id unique, status, last_seen).

### kyc_sessions
DiDit KYC verification sessions (session_id, user_id, status, vendor_data).

### mfa_factors
MFA factor records for TOTP setup (user_id, factor_id, status).

### firm_settings
Per-firm configuration settings (key-value pairs with user_id scope).

### approval_history
Workflow approval tracking (entity_type, entity_id, action, user_id).
