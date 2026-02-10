-- Migration: Add separate payment tracking fields to capital_call_allocations
-- Date: 2026-02-09
-- Purpose: Track capital paid, fees paid, and VAT paid separately for proper fund accounting

-- Add new columns for payment breakdown
ALTER TABLE capital_call_allocations
ADD COLUMN IF NOT EXISTS capital_paid DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fees_paid DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_paid DECIMAL(20, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN capital_call_allocations.capital_paid IS 'Amount paid toward principal/capital (counts toward commitment)';
COMMENT ON COLUMN capital_call_allocations.fees_paid IS 'Amount paid toward management fees (separate from commitment)';
COMMENT ON COLUMN capital_call_allocations.vat_paid IS 'Amount paid toward VAT/taxes (separate from commitment)';

-- Update existing records: distribute paid_amount proportionally across the new fields
-- This migration script handles existing data by distributing paid_amount based on the ratio of each component
UPDATE capital_call_allocations
SET
  capital_paid = CASE
    WHEN total_due > 0 THEN ROUND((principal_amount / total_due) * paid_amount, 2)
    ELSE 0
  END,
  fees_paid = CASE
    WHEN total_due > 0 THEN ROUND((COALESCE(management_fee_net, 0) / total_due) * paid_amount, 2)
    ELSE 0
  END,
  vat_paid = CASE
    WHEN total_due > 0 THEN ROUND((COALESCE(vat_amount, 0) / total_due) * paid_amount, 2)
    ELSE 0
  END
WHERE paid_amount > 0;

-- Verify the migration
SELECT
  id,
  principal_amount,
  management_fee_net,
  vat_amount,
  total_due,
  paid_amount,
  capital_paid,
  fees_paid,
  vat_paid,
  (capital_paid + fees_paid + vat_paid) as calculated_total_paid
FROM capital_call_allocations
WHERE paid_amount > 0
LIMIT 10;
