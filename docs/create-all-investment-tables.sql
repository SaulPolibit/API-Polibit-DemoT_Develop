-- =============================================
-- INVESTMENT MANAGER - COMPLETE DATABASE SETUP
-- Single script to create all tables in correct order
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. STRUCTURES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Fund', 'SA/LLC', 'Fideicomiso', 'Private Debt')),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  parent_structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  hierarchy_level INTEGER DEFAULT 1 CHECK (hierarchy_level BETWEEN 1 AND 5),
  total_commitment DECIMAL(20, 2) NOT NULL DEFAULT 0,
  total_called DECIMAL(20, 2) DEFAULT 0,
  total_distributed DECIMAL(20, 2) DEFAULT 0,
  total_invested DECIMAL(20, 2) DEFAULT 0,
  management_fee DECIMAL(5, 2) DEFAULT 2.0,
  carried_interest DECIMAL(5, 2) DEFAULT 20.0,
  hurdle_rate DECIMAL(5, 2) DEFAULT 8.0,
  waterfall_type VARCHAR(20) DEFAULT 'American',
  inception_date DATE,
  term_years INTEGER DEFAULT 10,
  extension_years INTEGER DEFAULT 2,
  final_date DATE,
  gp TEXT,
  fund_admin TEXT,
  legal_counsel TEXT,
  auditor TEXT,
  tax_advisor TEXT,
  bank_accounts JSONB DEFAULT '{}',
  base_currency VARCHAR(10) DEFAULT 'USD',
  tax_jurisdiction TEXT,
  regulatory_status TEXT,
  investment_strategy TEXT,
  target_returns TEXT,
  risk_profile TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_structures_user ON structures(user_id);
CREATE INDEX IF NOT EXISTS idx_structures_parent ON structures(parent_structure_id);
CREATE INDEX IF NOT EXISTS idx_structures_type ON structures(type);
CREATE INDEX IF NOT EXISTS idx_structures_status ON structures(status);

-- =============================================
-- 2. INVESTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_type VARCHAR(50) NOT NULL CHECK (investor_type IN ('Individual', 'Institution', 'Fund of Funds', 'Family Office')),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  country VARCHAR(100),
  tax_id VARCHAR(100),
  kyc_status VARCHAR(50) DEFAULT 'Pending',
  accredited_investor BOOLEAN DEFAULT false,
  risk_tolerance TEXT,
  investment_preferences JSONB DEFAULT '{}',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  nationality VARCHAR(100),
  passport_number VARCHAR(100),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  institution_name VARCHAR(255),
  institution_type VARCHAR(100),
  registration_number VARCHAR(100),
  legal_representative VARCHAR(255),
  fund_name VARCHAR(255),
  fund_manager VARCHAR(255),
  aum DECIMAL(20, 2),
  office_name VARCHAR(255),
  family_name VARCHAR(255),
  principal_contact VARCHAR(255),
  assets_under_management DECIMAL(20, 2),
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investors_user ON investors(user_id);
CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(investor_type);

-- =============================================
-- 3. STRUCTURE_INVESTORS (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS structure_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  commitment_amount DECIMAL(20, 2) NOT NULL,
  called_amount DECIMAL(20, 2) DEFAULT 0,
  distributed_amount DECIMAL(20, 2) DEFAULT 0,
  ownership_percent DECIMAL(5, 2),
  has_custom_terms BOOLEAN DEFAULT false,
  custom_management_fee DECIMAL(5, 2),
  custom_carried_interest DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(structure_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_structure_investors_structure ON structure_investors(structure_id);
CREATE INDEX IF NOT EXISTS idx_structure_investors_investor ON structure_investors(investor_id);

-- =============================================
-- 4. INVESTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  project_id UUID,
  investment_name VARCHAR(255) NOT NULL,
  investment_type VARCHAR(20) NOT NULL CHECK (investment_type IN ('EQUITY', 'DEBT', 'MIXED')),
  investment_date DATE,
  exit_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  equity_invested DECIMAL(20, 2),
  equity_ownership_percent DECIMAL(5, 2),
  equity_current_value DECIMAL(20, 2),
  equity_exit_value DECIMAL(20, 2),
  equity_realized_gain DECIMAL(20, 2),
  principal_provided DECIMAL(20, 2),
  interest_rate DECIMAL(5, 2),
  maturity_date DATE,
  principal_repaid DECIMAL(20, 2) DEFAULT 0,
  interest_received DECIMAL(20, 2) DEFAULT 0,
  outstanding_principal DECIMAL(20, 2),
  irr_percent DECIMAL(5, 2),
  moic DECIMAL(5, 2),
  total_returns DECIMAL(20, 2) DEFAULT 0,
  sector VARCHAR(100),
  geography VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'USD',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_structure ON investments(structure_id);
CREATE INDEX IF NOT EXISTS idx_investments_project ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);

-- =============================================
-- 5. CAPITAL CALLS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS capital_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  call_number VARCHAR(50) NOT NULL UNIQUE,
  call_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_date DATE,
  total_call_amount DECIMAL(20, 2) NOT NULL,
  total_paid_amount DECIMAL(20, 2) DEFAULT 0,
  total_unpaid_amount DECIMAL(20, 2),
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Partially Paid', 'Paid')),
  purpose TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capital_calls_structure ON capital_calls(structure_id);
CREATE INDEX IF NOT EXISTS idx_capital_calls_user ON capital_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_calls_status ON capital_calls(status);

-- =============================================
-- 6. CAPITAL CALL ALLOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS capital_call_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capital_call_id UUID NOT NULL REFERENCES capital_calls(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(20, 2) NOT NULL,
  paid_amount DECIMAL(20, 2) DEFAULT 0,
  remaining_amount DECIMAL(20, 2),
  status VARCHAR(50) DEFAULT 'Pending',
  payment_date DATE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(capital_call_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_capital_call_allocations_call ON capital_call_allocations(capital_call_id);
CREATE INDEX IF NOT EXISTS idx_capital_call_allocations_investor ON capital_call_allocations(investor_id);

-- =============================================
-- 7. DISTRIBUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  distribution_number VARCHAR(50) NOT NULL,
  distribution_date DATE NOT NULL,
  total_amount DECIMAL(20, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Paid')),
  source TEXT,
  source_equity_gain DECIMAL(20, 2) DEFAULT 0,
  source_debt_interest DECIMAL(20, 2) DEFAULT 0,
  source_debt_principal DECIMAL(20, 2) DEFAULT 0,
  source_other DECIMAL(20, 2) DEFAULT 0,
  waterfall_applied BOOLEAN DEFAULT false,
  tier1_amount DECIMAL(20, 2) DEFAULT 0,
  tier2_amount DECIMAL(20, 2) DEFAULT 0,
  tier3_amount DECIMAL(20, 2) DEFAULT 0,
  tier4_amount DECIMAL(20, 2) DEFAULT 0,
  lp_total_amount DECIMAL(20, 2) DEFAULT 0,
  gp_total_amount DECIMAL(20, 2) DEFAULT 0,
  management_fee_amount DECIMAL(20, 2) DEFAULT 0,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributions_structure ON distributions(structure_id);
CREATE INDEX IF NOT EXISTS idx_distributions_user ON distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON distributions(status);

-- =============================================
-- 8. DISTRIBUTION ALLOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS distribution_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(20, 2) NOT NULL,
  paid_amount DECIMAL(20, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  payment_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(distribution_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_distribution_allocations_dist ON distribution_allocations(distribution_id);
CREATE INDEX IF NOT EXISTS idx_distribution_allocations_investor ON distribution_allocations(investor_id);

-- =============================================
-- 9. WATERFALL TIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS waterfall_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL CHECK (tier_number BETWEEN 1 AND 4),
  tier_name VARCHAR(100),
  lp_share_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  gp_share_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  threshold_amount DECIMAL(20, 2),
  threshold_irr DECIMAL(5, 2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(structure_id, tier_number)
);

CREATE INDEX IF NOT EXISTS idx_waterfall_tiers_structure ON waterfall_tiers(structure_id);
CREATE INDEX IF NOT EXISTS idx_waterfall_tiers_user ON waterfall_tiers(user_id);

-- =============================================
-- 10. DOCUMENTS TABLE (Polymorphic)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('Structure', 'Investor', 'Investment', 'CapitalCall', 'Distribution')),
  entity_id UUID NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active);

-- =============================================
-- CREATE TRIGGER FUNCTION FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- APPLY TRIGGERS TO ALL TABLES
-- =============================================
DROP TRIGGER IF EXISTS update_structures_updated_at ON structures;
CREATE TRIGGER update_structures_updated_at BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investors_updated_at ON investors;
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_structure_investors_updated_at ON structure_investors;
CREATE TRIGGER update_structure_investors_updated_at BEFORE UPDATE ON structure_investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_capital_calls_updated_at ON capital_calls;
CREATE TRIGGER update_capital_calls_updated_at BEFORE UPDATE ON capital_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_capital_call_allocations_updated_at ON capital_call_allocations;
CREATE TRIGGER update_capital_call_allocations_updated_at BEFORE UPDATE ON capital_call_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distributions_updated_at ON distributions;
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distribution_allocations_updated_at ON distribution_allocations;
CREATE TRIGGER update_distribution_allocations_updated_at BEFORE UPDATE ON distribution_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waterfall_tiers_updated_at ON waterfall_tiers;
CREATE TRIGGER update_waterfall_tiers_updated_at BEFORE UPDATE ON waterfall_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERY
-- =============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
        'structures',
        'investors',
        'structure_investors',
        'investments',
        'capital_calls',
        'capital_call_allocations',
        'distributions',
        'distribution_allocations',
        'waterfall_tiers',
        'documents'
    );

    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ INVESTMENT MANAGER SETUP COMPLETE!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables created: % / 10', table_count;
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables:';
    RAISE NOTICE '  1. structures';
    RAISE NOTICE '  2. investors';
    RAISE NOTICE '  3. structure_investors (junction)';
    RAISE NOTICE '  4. investments';
    RAISE NOTICE '  5. capital_calls';
    RAISE NOTICE '  6. capital_call_allocations';
    RAISE NOTICE '  7. distributions';
    RAISE NOTICE '  8. distribution_allocations';
    RAISE NOTICE '  9. waterfall_tiers';
    RAISE NOTICE ' 10. documents';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All triggers created for updated_at';
    RAISE NOTICE '✅ All indexes created for performance';
    RAISE NOTICE '✅ Foreign keys and constraints applied';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to use! Test with your API endpoints.';
    RAISE NOTICE '===========================================';
END $$;

-- Show created tables
SELECT
    tablename as "Table Name",
    schemaname as "Schema"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'structures',
    'investors',
    'structure_investors',
    'investments',
    'capital_calls',
    'capital_call_allocations',
    'distributions',
    'distribution_allocations',
    'waterfall_tiers',
    'documents'
)
ORDER BY tablename;
