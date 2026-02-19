-- Migration: Add bank account fields to users table
-- These fields allow investors to store their bank details for receiving distributions

-- Add bank account fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN users.bank_name IS 'Name of the bank for receiving distributions';
COMMENT ON COLUMN users.bank_account_number IS 'Bank account number for receiving distributions';
COMMENT ON COLUMN users.bank_routing_number IS 'Bank routing number or CLABE for receiving distributions';
