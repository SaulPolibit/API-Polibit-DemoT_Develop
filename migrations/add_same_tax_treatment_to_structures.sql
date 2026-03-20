-- Migration: Add same_tax_treatment column to structures table
-- This tracks whether a structure uses unified or split withholding tax treatment

ALTER TABLE structures ADD COLUMN IF NOT EXISTS same_tax_treatment BOOLEAN DEFAULT true;

-- Backfill: if split fields are set but unified is null → false
UPDATE structures SET same_tax_treatment = false
WHERE (withholding_tax_natural_residents IS NOT NULL OR withholding_tax_legal_residents IS NOT NULL)
  AND withholding_tax_on_distributions IS NULL;
