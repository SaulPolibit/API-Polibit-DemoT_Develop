-- Migration: Add theme_config JSONB column to firm_settings
-- This column stores the white-label theme configuration (primary color, font, border radius, preset name)
-- Schema: { primaryColor: string, fontFamily?: string, borderRadius?: number, presetName?: string }

ALTER TABLE firm_settings ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'firm_settings' AND column_name = 'theme_config';
