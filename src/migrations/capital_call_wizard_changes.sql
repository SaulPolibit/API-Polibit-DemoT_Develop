-- Capital Call Wizard Changes (Doc 4)
-- New columns for fee offset, VAT on investments, and VAT on fund expenses

-- Header-level fields on capital_calls
ALTER TABLE capital_calls ADD COLUMN IF NOT EXISTS fee_offset_amount numeric DEFAULT 0;
ALTER TABLE capital_calls ADD COLUMN IF NOT EXISTS vat_on_investments numeric DEFAULT 0;
ALTER TABLE capital_calls ADD COLUMN IF NOT EXISTS vat_on_fund_expenses numeric DEFAULT 0;

-- Per-investor allocation fields
-- Note: fee_offset_amount and deemed_gp_contribution already exist on capital_call_allocations
ALTER TABLE capital_call_allocations ADD COLUMN IF NOT EXISTS vat_on_investments_amount numeric DEFAULT 0;
ALTER TABLE capital_call_allocations ADD COLUMN IF NOT EXISTS vat_on_fund_expenses_amount numeric DEFAULT 0;
