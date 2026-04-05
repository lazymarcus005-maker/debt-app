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

    const savingId = params.id;
    const body = await request.json();
    const { amount, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Verify saving belongs to user
    const { data: existingSaving, error: checkError } = await supabase
      .from('savings')
      .select('id, current_amount')
      .eq('id', savingId)
      .eq('user_id', decoded.userId)
      .single();

    if (checkError || !existingSaving) {
      return NextResponse.json(
        { error: 'Saving not found' },
        { status: 404 }
      );
    }

    // Create deposit record
    const { data: deposit, error: depositError } = await supabase
      .from('saving_deposits')
      .insert([
        {
          saving_id: savingId,
          amount,
          note,
          deposited_at: new Date().toISOString()
        }
      ])
      .select();

    if (depositError) {
      return NextResponse.json(
        { error: 'Failed to record deposit' },
        { status: 500 }
      );
    }

    // Update current_amount in savings
    const newCurrentAmount = existingSaving.current_amount + amount;
    const { error: updateError } = await supabase
      .from('savings')
      .update({
        current_amount: newCurrentAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', savingId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update saving amount' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { deposit: deposit[0], new_amount: newCurrentAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
