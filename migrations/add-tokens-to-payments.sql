-- Add tokens column to payments table
-- This field stores the number of tokens associated with a payment
ALTER TABLE payments
ADD COLUMN tokens INTEGER DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN payments.tokens IS 'Number of tokens associated with the payment';
