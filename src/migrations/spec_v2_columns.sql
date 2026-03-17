-- Migration: Spec V2 — Setup Wizard, Distribution Wizard, Distribution Notice
-- Date: 2026-03-17
-- Description: Add new columns to structures, distributions, distribution_allocations,
--              and create distribution_notice_templates table.

-- ============================================================
-- 1. STRUCTURES — New columns
-- ============================================================

-- Step 4: Recallable Distributions
ALTER TABLE structures ADD COLUMN IF NOT EXISTS recallable_distributions_enabled boolean DEFAULT false;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS recallable_limit_type text DEFAULT 'no_limit';
ALTER TABLE structures ADD COLUMN IF NOT EXISTS recallable_limit_value numeric DEFAULT NULL;

-- Step 4: Commitment Period (frontend sends but backend was dropping)
ALTER TABLE structures ADD COLUMN IF NOT EXISTS commitment_period_years integer DEFAULT NULL;

-- Step 5 Debt: Day Count Convention
ALTER TABLE structures ADD COLUMN IF NOT EXISTS day_count_convention text DEFAULT 'actual_365';

-- Step 6: New withholding tax columns (replace old split tax columns)
ALTER TABLE structures ADD COLUMN IF NOT EXISTS withholding_tax_on_distributions numeric DEFAULT NULL;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS withholding_tax_natural_residents numeric DEFAULT NULL;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS withholding_tax_natural_non_residents numeric DEFAULT NULL;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS withholding_tax_legal_residents numeric DEFAULT NULL;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS withholding_tax_legal_non_residents numeric DEFAULT NULL;

-- Step 7: Bank Transfer toggles
ALTER TABLE structures ADD COLUMN IF NOT EXISTS bank_transfer_local_enabled boolean DEFAULT false;
ALTER TABLE structures ADD COLUMN IF NOT EXISTS bank_transfer_international_enabled boolean DEFAULT false;

-- ============================================================
-- 2. DISTRIBUTIONS — New columns
-- ============================================================

-- Change 2: Source classifications (Income/ROC per source line)
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS source_classifications jsonb DEFAULT NULL;

-- Change 3: Recallable flag per distribution
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS recallable boolean DEFAULT false;

-- ============================================================
-- 3. DISTRIBUTION_ALLOCATIONS — New columns
-- ============================================================

ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS reinvestment_amount numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS income_portion numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS roc_portion numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS withholding_tax_amount numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS net_to_investor numeric DEFAULT 0;

-- ============================================================
-- 4. DISTRIBUTION_NOTICE_TEMPLATES — New table
-- ============================================================

CREATE TABLE IF NOT EXISTS distribution_notice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id uuid NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  header_title text DEFAULT 'DISTRIBUTION NOTICE',
  header_subtitle text DEFAULT 'Distribution No. {{DISTRIBUTION_NUMBER}}',
  include_firm_logo boolean DEFAULT true,
  legal_description text,
  footer_signatory_name text,
  footer_signatory_title text,
  footer_company_name text,
  footer_additional_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(structure_id)
);

-- Index for fast lookups by structure
CREATE INDEX IF NOT EXISTS idx_distribution_notice_templates_structure_id
  ON distribution_notice_templates(structure_id);
