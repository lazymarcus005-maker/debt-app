import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set. Check your .env.local file.');
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key');

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Bill {
  id: number;
  user_id: number;
  name: string;
  billing_type: 'recurring' | 'debt';
  sub_type: 'utility' | 'subscription' | 'loan' | 'installment' | 'credit_card';
  amount?: number;
  due_day: number;
  start_date: string;
  next_due_date: string;
  last_paid_at?: string;
  is_active: boolean;
  total_amount?: number;
  remaining_amount?: number;
  installment_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: number;
  bill_id: number;
  amount: number;
  paid_at: string;
  cycle_due_date: string;
  created_at: string;
}
