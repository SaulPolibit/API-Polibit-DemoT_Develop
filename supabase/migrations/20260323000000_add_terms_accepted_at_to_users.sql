ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill all existing investors so they skip the terms acceptance screen
UPDATE users SET terms_accepted_at = NOW() WHERE role = 3 AND is_active = true;
