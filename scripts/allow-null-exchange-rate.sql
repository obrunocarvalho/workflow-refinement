-- Allow NULL for exchange_rate column in inventory table
-- This is needed for cases where payment is pending or exchange rate is not yet defined

ALTER TABLE inventory ALTER COLUMN exchange_rate DROP NOT NULL;
