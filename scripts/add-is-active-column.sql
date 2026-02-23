-- Add is_active column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing products to be active
UPDATE products SET is_active = true WHERE is_active IS NULL;
