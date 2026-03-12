-- Add ILPA fee structure and payment method fields to structures table
-- Phase 3: Post-commitment fee, flat fee, management fee offset
-- Phase 4: Preferred return compounding
-- Phase 5: PoliBit and Card payment methods

ALTER TABLE structures
ADD COLUMN IF NOT EXISTS post_commitment_fee_rate DOUBLE PRECISION DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flat_management_fee_rate DOUBLE PRECISION DEFAULT NULL,
ADD COLUMN IF NOT EXISTS management_fee_offset BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fee_offset_rate VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pref_return_compounding VARCHAR(20) DEFAULT 'compound',
ADD COLUMN IF NOT EXISTS pay_with_polibit_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pay_with_polibit_settlement VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS payment_card_enabled BOOLEAN DEFAULT FALSE;
