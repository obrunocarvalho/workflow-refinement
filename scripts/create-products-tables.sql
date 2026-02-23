-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100) DEFAULT 'Gamepad2',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  current_price NUMERIC(12, 2),
  currency VARCHAR(10) DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product price history table
CREATE TABLE IF NOT EXISTS product_price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(50) DEFAULT 'em_estoque';

-- Add product_id to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_paid ON inventory(is_paid);
CREATE INDEX IF NOT EXISTS idx_inventory_marketplace ON inventory(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id);

-- Insert some default categories
INSERT INTO categories (name, icon) VALUES 
  ('Geral', 'Package'),
  ('Jogos Digitais', 'Gamepad2'),
  ('Gift Cards', 'Gift'),
  ('Assinaturas', 'CreditCard'),
  ('Skins', 'Palette'),
  ('Moedas Virtuais', 'Coins')
ON CONFLICT (name) DO NOTHING;
