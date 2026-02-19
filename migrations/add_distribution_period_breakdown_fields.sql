-- Migration: Add distribution period and breakdown fields
-- These fields support the ProximityParks distribution methodology

-- Add period fields
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS start_of_period DATE;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS end_of_period DATE;

-- Add distribution breakdown fields
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS noi DECIMAL(18,2) DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS refinancing_proceeds DECIMAL(18,2) DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS bank_interest DECIMAL(18,2) DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS asset_disposal DECIMAL(18,2) DEFAULT 0;

-- Add reinvestment field
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS reinvestment DECIMAL(18,2) DEFAULT 0;

-- Add notice and payment fields
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS day_of_notice DATE;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS business_days INTEGER DEFAULT 10;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS payment_date_deadline DATE;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN distributions.start_of_period IS 'Start date of the distribution period';
COMMENT ON COLUMN distributions.end_of_period IS 'End date of the distribution period (calculated from distribution frequency)';
COMMENT ON COLUMN distributions.noi IS 'Net Operating Income amount';
COMMENT ON COLUMN distributions.refinancing_proceeds IS 'Refinancing proceeds amount';
COMMENT ON COLUMN distributions.bank_interest IS 'Bank interest amount';
COMMENT ON COLUMN distributions.asset_disposal IS 'Asset disposal proceeds amount';
COMMENT ON COLUMN distributions.reinvestment IS 'Amount reinvested from this distribution';
COMMENT ON COLUMN distributions.day_of_notice IS 'Day of notice for the distribution';
COMMENT ON COLUMN distributions.business_days IS 'Number of business days until payment deadline';
COMMENT ON COLUMN distributions.payment_date_deadline IS 'Payment date deadline (calculated: day_of_notice + business_days)';
COMMENT ON COLUMN distributions.description IS 'Distribution description';
