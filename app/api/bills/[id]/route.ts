import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function GET(
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

    const billId = params.id;

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .eq('user_id', decoded.userId)
      .single();

    if (billError || !bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    const { data: creditor } = bill.creditor_id
      ? await supabase
          .from('creditors')
          .select('*')
          .eq('id', bill.creditor_id)
          .single()
      : { data: null };

    const { data: payments, error: paymentsError } = await supabase
      .from('bill_payments')
      .select('*')
      .eq('bill_id', billId)
      .order('paid_at', { ascending: false });

    if (paymentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch bill payments' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        bill: {
          ...bill,
          creditor: creditor || null
        },
        payments: payments || []
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const billId = params.id;
    const body = await request.json();
    const {
      name,
      billing_type,
      sub_type,
      description,
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

    const { data: existingBill, error: checkError } = await supabase
      .from('bills')
      .select('id')
      .eq('id', billId)
      .eq('user_id', decoded.userId)
      .single();

    if (checkError || !existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    const nextDueDate = new Date(today.getFullYear(), today.getMonth(), due_day);
    if (nextDueDate < today) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const { data: updatedBill, error } = await supabase
      .from('bills')
      .update({
        name,
        billing_type,
        sub_type,
        description,
        amount: billing_type === 'recurring' ? amount : null,
        due_day,
        start_date,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        total_amount: billing_type === 'debt' ? total_amount : null,
        remaining_amount: billing_type === 'debt' ? remaining_amount : null,
        installment_amount: billing_type === 'debt' ? installment_amount : null,
        creditor_id: creditor_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', billId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update bill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bill: updatedBill[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const billId = params.id;

    const { data: existingBill, error: checkError } = await supabase
      .from('bills')
      .select('id')
      .eq('id', billId)
      .eq('user_id', decoded.userId)
      .single();

    if (checkError || !existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('bills')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', billId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete bill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Bill deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}