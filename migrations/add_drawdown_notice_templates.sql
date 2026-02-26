-- Migration: Add drawdown_notice_templates table
-- Stores per-structure templates for generating drawdown notice PDFs
-- One template per structure, reused across capital calls

CREATE TABLE IF NOT EXISTS drawdown_notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,

  -- Header
  header_title VARCHAR(255) DEFAULT 'DRAWDOWN NOTICE',
  header_subtitle VARCHAR(255) DEFAULT 'Capital Call No. {{CALL_NUMBER}}',
  include_firm_logo BOOLEAN DEFAULT true,

  -- Body
  legal_description TEXT,

  -- Payment Instructions
  payment_instructions_note TEXT,

  -- Footer / Signature Block
  footer_signatory_name VARCHAR(255),
  footer_signatory_title VARCHAR(255),
  footer_company_name VARCHAR(255),
  footer_additional_notes TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One template per structure
  UNIQUE(structure_id)
);

-- Index for fast lookup by structure
CREATE INDEX IF NOT EXISTS idx_drawdown_notice_templates_structure_id
  ON drawdown_notice_templates(structure_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drawdown_notice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_drawdown_notice_templates_updated_at
  BEFORE UPDATE ON drawdown_notice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_drawdown_notice_templates_updated_at();
