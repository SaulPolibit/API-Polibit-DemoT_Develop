/**
 * Migration: Add investor-specific notification fields
 * Description: Adds notification preferences for capital calls, distributions, tax forms, payments, reports, and security
 * Date: 2025-12-24
 */

-- Add capital call notices field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS capital_call_notices BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.capital_call_notices IS 'Receive notifications for capital call notices';

-- Add distribution notices field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS distribution_notices BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.distribution_notices IS 'Receive notifications for distribution notices';

-- Add K-1 tax forms field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS k1_tax_forms BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.k1_tax_forms IS 'Receive notifications for K-1 tax form availability';

-- Add payment confirmations field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS payment_confirmations BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.payment_confirmations IS 'Receive notifications for payment confirmations';

-- Add quarterly reports field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS quarterly_reports BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.quarterly_reports IS 'Receive notifications for quarterly reports';

-- Add security alerts field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS security_alerts BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.security_alerts IS 'Receive notifications for security alerts and important account activity';

-- Add urgent capital calls field
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS urgent_capital_calls BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_settings.urgent_capital_calls IS 'Receive urgent notifications for time-sensitive capital calls';

-- Create indexes for frequently queried notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_settings_capital_calls
ON notification_settings(capital_call_notices) WHERE capital_call_notices = true;

CREATE INDEX IF NOT EXISTS idx_notification_settings_urgent_capital_calls
ON notification_settings(urgent_capital_calls) WHERE urgent_capital_calls = true;

CREATE INDEX IF NOT EXISTS idx_notification_settings_security_alerts
ON notification_settings(security_alerts) WHERE security_alerts = true;
