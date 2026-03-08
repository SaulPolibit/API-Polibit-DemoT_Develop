-- Add max_investor_restriction column to structures table
-- Stores the maximum number of investors allowed by regulation (NULL = no restriction)
ALTER TABLE structures
ADD COLUMN IF NOT EXISTS max_investor_restriction INTEGER DEFAULT NULL;
