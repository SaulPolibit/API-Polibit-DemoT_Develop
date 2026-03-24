-- Fix distributions table: add missing waterfall / LP-GP columns
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS waterfall_applied boolean DEFAULT false;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS tier1_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS tier2_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS tier3_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS tier4_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS lp_total_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS gp_total_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS management_fee_amount numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'draft';
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS investment_id uuid;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS noi numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS refinancing_proceeds numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS bank_interest numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS asset_disposal numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS reinvestment numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS start_of_period date;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS end_of_period date;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS day_of_notice date;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS business_days integer DEFAULT 5;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS payment_date_deadline date;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS source_equity_gain numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS source_debt_interest numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS source_debt_principal numeric DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS source_other numeric DEFAULT 0;

-- Fix distribution_allocations table: ensure required columns exist
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS allocated_amount numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE distribution_allocations ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';

-- Create unique constraint on (distribution_id, user_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'distribution_allocations_distribution_id_user_id_key'
  ) THEN
    ALTER TABLE distribution_allocations
      ADD CONSTRAINT distribution_allocations_distribution_id_user_id_key
      UNIQUE (distribution_id, user_id);
  END IF;
END $$;

-- Create FK from user_id to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'distribution_allocations_user_id_fkey'
  ) THEN
    ALTER TABLE distribution_allocations
      ADD CONSTRAINT distribution_allocations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
