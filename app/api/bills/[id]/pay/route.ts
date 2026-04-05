import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const billId = parseInt(params.id);
    const { amount, cycle_due_date } = await request.json();

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('bill_payments')
      .insert([
        {
          bill_id: billId,
          amount,
          paid_at: new Date().toISOString(),
          cycle_due_date,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (paymentError) {
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Update bill last_paid_at
    const { error: updateError } = await supabase
      .from('bills')
      .update({
        last_paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', billId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update bill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payment: payment[0] }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
