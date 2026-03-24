-- Add payment receipt image columns to capital_call_allocations
ALTER TABLE capital_call_allocations
  ADD COLUMN IF NOT EXISTS payment_image TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS receipt_file_name TEXT DEFAULT NULL;
