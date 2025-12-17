-- Add capital call, tax rates, and blockchain fields to structures table
-- This migration adds ownership percentage, capital call configuration, tax rates, and blockchain fields

-- Add parent structure ownership percentage
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS parent_structure_ownership_percentage DOUBLE PRECISION;

-- Add capital call configuration fields
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS capital_call_notice_period INTEGER;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS capital_call_payment_deadline INTEGER;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS distribution_frequency VARCHAR(100);

-- Add tax rate fields for natural persons
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS witholding_dividend_tax_rate_natural_persons DOUBLE PRECISION;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS income_debt_tax_rate_natural_persons DOUBLE PRECISION;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS income_equity_tax_rate_natural_persons DOUBLE PRECISION;

-- Add tax rate fields for legal entities
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS witholding_dividend_tax_rate_legal_entities DOUBLE PRECISION;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS income_debt_tax_rate_legal_entities DOUBLE PRECISION;

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS income_equity_tax_rate_legal_entities DOUBLE PRECISION;

-- Add blockchain and document fields
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS wallet_owner_address VARCHAR(255);

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS operating_agreement_hash VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_structures_parent_ownership ON structures(parent_structure_ownership_percentage);
CREATE INDEX IF NOT EXISTS idx_structures_distribution_frequency ON structures(distribution_frequency);
CREATE INDEX IF NOT EXISTS idx_structures_wallet_owner_address ON structures(wallet_owner_address);
CREATE INDEX IF NOT EXISTS idx_structures_operating_agreement_hash ON structures(operating_agreement_hash);

-- Add comments to document the schema
COMMENT ON COLUMN structures.parent_structure_ownership_percentage IS 'Ownership percentage in parent structure';
COMMENT ON COLUMN structures.capital_call_notice_period IS 'Notice period for capital calls in days';
COMMENT ON COLUMN structures.capital_call_payment_deadline IS 'Payment deadline for capital calls in days';
COMMENT ON COLUMN structures.distribution_frequency IS 'Frequency of distributions (quarterly, annually, etc.)';
COMMENT ON COLUMN structures.witholding_dividend_tax_rate_natural_persons IS 'Withholding tax rate for dividends - natural persons (%)';
COMMENT ON COLUMN structures.witholding_dividend_tax_rate_legal_entities IS 'Withholding tax rate for dividends - legal entities (%)';
COMMENT ON COLUMN structures.income_debt_tax_rate_natural_persons IS 'Income tax rate for debt instruments - natural persons (%)';
COMMENT ON COLUMN structures.income_equity_tax_rate_natural_persons IS 'Income tax rate for equity instruments - natural persons (%)';
COMMENT ON COLUMN structures.income_debt_tax_rate_legal_entities IS 'Income tax rate for debt instruments - legal entities (%)';
COMMENT ON COLUMN structures.income_equity_tax_rate_legal_entities IS 'Income tax rate for equity instruments - legal entities (%)';
COMMENT ON COLUMN structures.wallet_owner_address IS 'Blockchain wallet owner address';
COMMENT ON COLUMN structures.operating_agreement_hash IS 'Hash of operating agreement document';
