-- Contract Management System Migration
-- Creates tables for configurable contract templates and structure assignments

-- 1. contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  docuseal_template_url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'contract',
  signature_type TEXT NOT NULL DEFAULT 'investor_only',
  jurisdiction TEXT,
  category TEXT DEFAULT 'subscription',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints
ALTER TABLE contract_templates
  ADD CONSTRAINT contract_templates_type_check CHECK (type IN ('contract', 'action')),
  ADD CONSTRAINT contract_templates_signature_type_check CHECK (signature_type IN ('investor_only', 'management_only', 'investor_and_management')),
  ADD CONSTRAINT contract_templates_jurisdiction_check CHECK (jurisdiction IS NULL OR jurisdiction IN ('national', 'international')),
  ADD CONSTRAINT contract_templates_category_check CHECK (category IN ('subscription', 'side_letter', 'nda', 'action', 'other'));

-- 2. structure_contracts table
CREATE TABLE IF NOT EXISTS structure_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  contract_template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  trigger_point TEXT NOT NULL DEFAULT 'pre_payment',
  signer TEXT NOT NULL DEFAULT 'investor',
  is_required BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT true,
  signing_order INT DEFAULT 0,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(structure_id, contract_template_id)
);

-- Add constraints
ALTER TABLE structure_contracts
  ADD CONSTRAINT structure_contracts_trigger_point_check CHECK (trigger_point IN ('pre_payment', 'post_payment', 'post_closing', 'on_demand')),
  ADD CONSTRAINT structure_contracts_signer_check CHECK (signer IN ('investor', 'management', 'both_sequential'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_structure_contracts_structure_id ON structure_contracts(structure_id);
CREATE INDEX IF NOT EXISTS idx_structure_contracts_trigger_point ON structure_contracts(structure_id, trigger_point);

-- 3. Alter docuseal_submissions to support contract management
ALTER TABLE docuseal_submissions
  ADD COLUMN IF NOT EXISTS contract_template_id UUID REFERENCES contract_templates(id),
  ADD COLUMN IF NOT EXISTS management_status TEXT DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS management_submission_id INT,
  ADD COLUMN IF NOT EXISTS management_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trigger_point TEXT;

-- Add constraint for management_status
ALTER TABLE docuseal_submissions
  ADD CONSTRAINT docuseal_submissions_management_status_check CHECK (management_status IN ('not_required', 'pending', 'completed'));

-- Index for pending countersigns query
CREATE INDEX IF NOT EXISTS idx_docuseal_submissions_management_status ON docuseal_submissions(management_status) WHERE management_status = 'pending';

-- Updated_at trigger for contract_templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contract_templates_updated_at ON contract_templates;
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all operations for authenticated users (adjust per your security model)
CREATE POLICY "Allow all for authenticated users" ON contract_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON structure_contracts
  FOR ALL USING (true) WITH CHECK (true);
