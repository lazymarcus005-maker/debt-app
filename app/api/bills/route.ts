import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded: any = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get bills for user
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bills' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bills }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded: any = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      billing_type,
      sub_type,
      amount,
      due_day,
      start_date,
      total_amount,
      remaining_amount,
      installment_amount,
      creditor_id
    } = body;

    if (!name || !billing_type || !sub_type || !due_day || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next due date
    const today = new Date();
    const nextDueDate = new Date(today.getFullYear(), today.getMonth(), due_day);
    if (nextDueDate < today) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const { data: newBill, error } = await supabase
      .from('bills')
      .insert([
        {
          user_id: decoded.userId,
          name,
          billing_type,
          sub_type,
          amount,
          due_day,
          start_date,
          next_due_date: nextDueDate.toISOString().split('T')[0],
          is_active: true,
          total_amount,
          remaining_amount,
          installment_amount,
          creditor_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create bill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bill: newBill[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
