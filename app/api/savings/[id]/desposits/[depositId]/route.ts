import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; depositId: string } }
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
    const depositId = params.depositId;

    // Get deposit record
    const { data: deposit, error: depositError } = await supabase
      .from('saving_deposits')
      .select('amount')
      .eq('id', depositId)
      .single();

    if (depositError || !deposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      );
    }

    // Verify saving belongs to user
    const { data: saving } = await supabase
      .from('savings')
      .select('id, current_amount, user_id')
      .eq('id', savingId)
      .single();

    if (!saving || saving.user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete deposit
    const { error: deleteError } = await supabase
      .from('saving_deposits')
      .delete()
      .eq('id', depositId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete deposit' },
        { status: 500 }
      );
    }

    // Update current_amount in savings (subtract the amount)
    const newCurrentAmount = Math.max(0, saving.current_amount - deposit.amount);
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
      { message: 'Deposit deleted successfully', new_amount: newCurrentAmount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; depositId: string } }
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
    const depositId = params.depositId;
    const body = await request.json();
    const { amount, note } = body;

    // Get old deposit record
    const { data: oldDeposit, error: depositError } = await supabase
      .from('saving_deposits')
      .select('amount')
      .eq('id', depositId)
      .single();

    if (depositError || !oldDeposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      );
    }

    // Verify saving belongs to user
    const { data: saving } = await supabase
      .from('savings')
      .select('id, current_amount, user_id')
      .eq('id', savingId)
      .single();

    if (!saving || saving.user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update deposit
    const { data: updatedDeposit, error: updateError } = await supabase
      .from('saving_deposits')
      .update({
        amount: amount || oldDeposit.amount,
        note: note !== undefined ? note : undefined
      })
      .eq('id', depositId)
      .select();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update deposit' },
        { status: 500 }
      );
    }

    // Calculate new amount difference
    const amountDifference = (amount || oldDeposit.amount) - oldDeposit.amount;
    const newCurrentAmount = saving.current_amount + amountDifference;

    // Update current_amount in savings
    const { error: savingError } = await supabase
      .from('savings')
      .update({
        current_amount: newCurrentAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', savingId);

    if (savingError) {
      return NextResponse.json(
        { error: 'Failed to update saving amount' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { deposit: updatedDeposit[0], new_amount: newCurrentAmount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
