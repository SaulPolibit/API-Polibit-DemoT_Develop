-- Migration: Create/Update notification_settings table
-- This migration creates the notification_settings table if it doesn't exist
-- and adds all required columns

-- ============================================================================
-- Create notification_settings table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  portfolio_notifications BOOLEAN DEFAULT true,
  report_notifications BOOLEAN DEFAULT true,
  investor_activity_notifications BOOLEAN DEFAULT true,
  system_update_notifications BOOLEAN DEFAULT true,
  marketing_email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_frequency VARCHAR(20) DEFAULT 'immediate',
  preferred_contact_method VARCHAR(20) DEFAULT 'email',
  report_delivery_format VARCHAR(20) DEFAULT 'both',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ============================================================================
-- Add missing columns if table already exists
-- ============================================================================

-- Add email_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add portfolio_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS portfolio_notifications BOOLEAN DEFAULT true;

-- Add report_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS report_notifications BOOLEAN DEFAULT true;

-- Add investor_activity_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS investor_activity_notifications BOOLEAN DEFAULT true;

-- Add system_update_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS system_update_notifications BOOLEAN DEFAULT true;

-- Add marketing_email_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS marketing_email_notifications BOOLEAN DEFAULT false;

-- Add push_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;

-- Add sms_notifications column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;

-- Add notification_frequency column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS notification_frequency VARCHAR(20) DEFAULT 'immediate';

-- Add preferred_contact_method column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'email';

-- Add report_delivery_format column if missing
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS report_delivery_format VARCHAR(20) DEFAULT 'both';

-- ============================================================================
-- Create indexes for better query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id
ON notification_settings(user_id);

-- ============================================================================
-- Add comments to document the columns
-- ============================================================================

COMMENT ON TABLE notification_settings IS
'User notification preferences and settings';

COMMENT ON COLUMN notification_settings.user_id IS
'Foreign key to users table';

COMMENT ON COLUMN notification_settings.email_notifications IS
'Enable/disable email notifications';

COMMENT ON COLUMN notification_settings.portfolio_notifications IS
'Enable/disable portfolio update notifications';

COMMENT ON COLUMN notification_settings.report_notifications IS
'Enable/disable report notifications';

COMMENT ON COLUMN notification_settings.investor_activity_notifications IS
'Enable/disable investor activity notifications';

COMMENT ON COLUMN notification_settings.system_update_notifications IS
'Enable/disable system update notifications';

COMMENT ON COLUMN notification_settings.marketing_email_notifications IS
'Enable/disable marketing email notifications';

COMMENT ON COLUMN notification_settings.push_notifications IS
'Enable/disable push notifications';

COMMENT ON COLUMN notification_settings.sms_notifications IS
'Enable/disable SMS notifications';

COMMENT ON COLUMN notification_settings.notification_frequency IS
'How often the user wants to receive notifications: immediate, daily, weekly, monthly';

COMMENT ON COLUMN notification_settings.preferred_contact_method IS
'User preferred method of contact: email, sms, push, phone';

COMMENT ON COLUMN notification_settings.report_delivery_format IS
'Preferred format for report delivery: pdf, excel, both';

-- ============================================================================
-- Verification Query (optional - uncomment to verify changes)
-- ============================================================================

-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'notification_settings'
-- ORDER BY ordinal_position;
