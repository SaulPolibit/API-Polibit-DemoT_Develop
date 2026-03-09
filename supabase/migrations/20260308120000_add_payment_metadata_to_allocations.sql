-- Add payment metadata columns to capital_call_allocations
-- These store the payment method, reference, and date when an investor pays via LP Portal
-- payment_approval_status tracks the approval workflow: pending → approved/rejected

ALTER TABLE capital_call_allocations
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_approval_status TEXT DEFAULT NULL;
