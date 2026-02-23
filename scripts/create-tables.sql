-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.sales;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.marketplaces;
DROP TABLE IF EXISTS public.suppliers;

-- Create marketplaces table
CREATE TABLE public.marketplaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  default_fee DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  contact VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table (produtos digitais)
CREATE TABLE public.inventory (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  login VARCHAR(200),
  purchase_date DATE NOT NULL,
  supplier_id INTEGER REFERENCES public.suppliers(id),
  supplier_code VARCHAR(100),
  cost_original DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  exchange_rate DECIMAL(10, 4) NOT NULL,
  cost_brl DECIMAL(10, 2) GENERATED ALWAYS AS (cost_original * exchange_rate) STORED,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table (vendas por marketplace)
CREATE TABLE public.sales (
  id SERIAL PRIMARY KEY,
  sale_code VARCHAR(100) NOT NULL,
  sale_date DATE NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  login VARCHAR(200),
  login_post_sale VARCHAR(200),
  buyer VARCHAR(200),
  marketplace_id INTEGER REFERENCES public.marketplaces(id),
  marketplace_fee DECIMAL(10, 2) DEFAULT 0,
  game VARCHAR(200),
  link TEXT,
  inventory_id INTEGER REFERENCES public.inventory(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table (custos gerais da empresa)
CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('labor', 'fees', 'dividends', 'suppliers', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  beneficiary VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default marketplaces
INSERT INTO public.marketplaces (name, default_fee) VALUES
  ('Mercado Livre', 11.00),
  ('OLX', 0.00),
  ('Shopee', 12.00),
  ('Amazon', 15.00),
  ('Outros', 0.00);

-- Create indexes for better performance
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_marketplace ON public.sales(marketplace_id);
CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_inventory_purchase_date ON public.inventory(purchase_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
