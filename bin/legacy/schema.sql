-- Finance Manager Database Schema
-- Run these queries in your Supabase SQL Editor

-- Create USERS table
CREATE TABLE IF NOT EXISTS public.USERS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on USERS
ALTER TABLE public.USERS ENABLE ROW LEVEL SECURITY;

-- Create BILLS table
CREATE TABLE IF NOT EXISTS public.BILLS (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.USERS(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  billing_type VARCHAR(50) NOT NULL, -- 'recurring' or 'debt'
  sub_type VARCHAR(50) NOT NULL, -- 'utility', 'subscription', 'loan', 'installment', 'credit_card'
  description TEXT,
  amount DECIMAL(10, 2),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  start_date DATE NOT NULL,
  next_due_date DATE,
  last_paid_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  total_amount DECIMAL(10, 2),
  remaining_amount DECIMAL(10, 2),
  installment_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on BILLS
ALTER TABLE public.BILLS ENABLE ROW LEVEL SECURITY;

-- Migration helper for existing databases
ALTER TABLE public.BILLS
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create BILL_PAYMENTS table
CREATE TABLE IF NOT EXISTS public.BILL_PAYMENTS (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES public.BILLS(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on BILL_PAYMENTS
ALTER TABLE public.BILL_PAYMENTS ENABLE ROW LEVEL SECURITY;

-- Create SAVINGS table
CREATE TABLE IF NOT EXISTS public.SAVINGS (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.USERS(id) ON DELETE CASCADE,
  goal_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'emergency', 'vacation', 'education', 'home', 'vehicle', 'other'
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on SAVINGS
ALTER TABLE public.SAVINGS ENABLE ROW LEVEL SECURITY;

-- Create SAVING_DEPOSITS table (to track deposits history)
CREATE TABLE IF NOT EXISTS public.SAVING_DEPOSITS (
  id SERIAL PRIMARY KEY,
  saving_id INTEGER NOT NULL REFERENCES public.SAVINGS(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  note VARCHAR(255),
  deposited_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on SAVING_DEPOSITS
ALTER TABLE public.SAVING_DEPOSITS ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_bills_user_id ON public.BILLS(user_id);
CREATE INDEX idx_bills_active ON public.BILLS(is_active);
CREATE INDEX idx_bill_payments_bill_id ON public.BILL_PAYMENTS(bill_id);
CREATE INDEX idx_bill_payments_paid_at ON public.BILL_PAYMENTS(paid_at);
CREATE INDEX idx_savings_user_id ON public.SAVINGS(user_id);
CREATE INDEX idx_savings_active ON public.SAVINGS(is_active);
CREATE INDEX idx_saving_deposits_saving_id ON public.SAVING_DEPOSITS(saving_id);

-- Insert sample user for testing (email is password for demo)
INSERT INTO public.USERS (name, email) VALUES 
  ('Demo User', 'demo@example.com')
ON CONFLICT (email) DO NOTHING;

-- Insert sample bills
INSERT INTO public.BILLS (
  user_id, name, billing_type, sub_type, amount, due_day, start_date, is_active
) VALUES
  (1, 'Electricity', 'recurring', 'utility', 100, 27, '2024-01-01', true),
  (1, 'Water', 'recurring', 'utility', 150, 25, '2024-01-01', true),
  (1, 'Internet', 'recurring', 'subscription', 300, 1, '2024-01-01', true),
  (1, 'Home Rent', 'recurring', 'subscription', 5000, 1, '2024-01-01', true),
  (1, 'BlueCard', 'debt', 'credit_card', 12756, 20, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- Insert sample savings
INSERT INTO public.SAVINGS (
  user_id, goal_name, category, target_amount, current_amount, target_date, description, is_active
) VALUES
  (1, 'Emergency Fund', 'emergency', 10000, 3500, '2025-12-31', 'Build emergency fund for 6 months expenses', true),
  (1, 'Vacation Fund', 'vacation', 5000, 1200, '2025-06-30', 'Dream vacation to Thailand', true),
  (1, 'Car Down Payment', 'vehicle', 30000, 8000, '2026-01-31', 'Save for new car', true)
ON CONFLICT DO NOTHING;

-- Insert sample saving deposits
INSERT INTO public.SAVING_DEPOSITS (
  saving_id, amount, note, deposited_at
) VALUES
  (1, 1000, 'Monthly savings', '2024-01-15'),
  (1, 1000, 'Monthly savings', '2024-02-15'),
  (1, 1500, 'Bonus deposit', '2024-03-01'),
  (2, 500, 'Monthly savings', '2024-01-20'),
  (2, 700, 'Monthly savings', '2024-02-20'),
  (3, 3000, 'Initial deposit', '2024-01-01'),
  (3, 2500, 'Monthly savings', '2024-02-01'),
  (3, 2500, 'Monthly savings', '2024-03-01')
ON CONFLICT DO NOTHING;

-- RLS Policies (optional - for security)
-- Allow users to see only their own data
-- For now, we rely on server-side JWT verification
