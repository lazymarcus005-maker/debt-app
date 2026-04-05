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

    const savingId = params.id;

    // Get saving with deposits
    const { data: saving, error: savingError } = await supabase
      .from('savings')
      .select('*')
      .eq('id', savingId)
      .eq('user_id', decoded.userId)
      .single();

    if (savingError || !saving) {
      return NextResponse.json(
        { error: 'Saving not found' },
        { status: 404 }
      );
    }

    // Get deposits for this saving
    const { data: deposits, error: depositsError } = await supabase
      .from('saving_deposits')
      .select('*')
      .eq('saving_id', savingId)
      .order('deposited_at', { ascending: false });

    if (depositsError) {
      return NextResponse.json(
        { error: 'Failed to fetch deposits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saving, deposits }, { status: 200 });
  } catch (error) {
    console.error('Error fetching saving:', error);
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

    const savingId = params.id;
    const body = await request.json();

    const { data: existingSaving, error: checkError } = await supabase
      .from('savings')
      .select('id')
      .eq('id', savingId)
      .eq('user_id', decoded.userId)
      .single();

    if (checkError || !existingSaving) {
      return NextResponse.json(
        { error: 'Saving not found' },
        { status: 404 }
      );
    }

    const { data: updatedSaving, error } = await supabase
      .from('savings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', savingId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update saving' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saving: updatedSaving[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating saving:', error);
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

    const savingId = params.id;

    const { data: existingSaving, error: checkError } = await supabase
      .from('savings')
      .select('id')
      .eq('id', savingId)
      .eq('user_id', decoded.userId)
      .single();

    if (checkError || !existingSaving) {
      return NextResponse.json(
        { error: 'Saving not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('savings')
      .update({ is_active: false })
      .eq('id', savingId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete saving' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Saving deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting saving:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
