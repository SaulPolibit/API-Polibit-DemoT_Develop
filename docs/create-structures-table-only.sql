-- Create ONLY the structures table first
-- This is a minimal version to test if the basic table creation works

-- Drop existing table if you want to recreate it
-- DROP TABLE IF EXISTS structures CASCADE;

-- Create structures table
CREATE TABLE IF NOT EXISTS structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active',

  -- Hierarchy
  parent_structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  hierarchy_level INTEGER DEFAULT 1,

  -- Financial Totals
  total_commitment DECIMAL(20, 2) NOT NULL DEFAULT 0,
  total_called DECIMAL(20, 2) DEFAULT 0,
  total_distributed DECIMAL(20, 2) DEFAULT 0,
  total_invested DECIMAL(20, 2) DEFAULT 0,

  -- Economic Terms
  management_fee DECIMAL(5, 2) DEFAULT 2.0,
  carried_interest DECIMAL(5, 2) DEFAULT 20.0,
  hurdle_rate DECIMAL(5, 2) DEFAULT 8.0,
  waterfall_type VARCHAR(20) DEFAULT 'American',

  -- Dates
  inception_date DATE,
  term_years INTEGER DEFAULT 10,
  extension_years INTEGER DEFAULT 2,
  final_date DATE,

  -- Service Providers
  gp TEXT,
  fund_admin TEXT,
  legal_counsel TEXT,
  auditor TEXT,
  tax_advisor TEXT,

  -- Additional Info
  bank_accounts JSONB DEFAULT '{}',
  base_currency VARCHAR(10) DEFAULT 'USD',
  tax_jurisdiction TEXT,
  regulatory_status TEXT,
  investment_strategy TEXT,
  target_returns TEXT,
  risk_profile TEXT,

  -- Metadata (user_id must reference an existing users table)
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_structures_user ON structures(user_id);
CREATE INDEX IF NOT EXISTS idx_structures_parent ON structures(parent_structure_id);
CREATE INDEX IF NOT EXISTS idx_structures_type ON structures(type);
CREATE INDEX IF NOT EXISTS idx_structures_status ON structures(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_structures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_structures_timestamp ON structures;
CREATE TRIGGER update_structures_timestamp
  BEFORE UPDATE ON structures
  FOR EACH ROW
  EXECUTE FUNCTION update_structures_updated_at();

-- Verify it was created
SELECT 'structures table created successfully!' as message;
SELECT COUNT(*) as row_count FROM structures;
