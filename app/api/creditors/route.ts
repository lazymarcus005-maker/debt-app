import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { data: creditors, error } = await supabase
      .from('creditors')
      .select('*')
      .order('type')
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch creditors' },
        { status: 500 }
      );
    }

    return NextResponse.json({ creditors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching creditors:', error);
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
    const { name, type = 'bank' } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Creditor name is required' },
        { status: 400 }
      );
    }

    const { data: newCreditor, error } = await supabase
      .from('creditors')
      .insert([
        {
          name: name.trim(),
          type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Creditor already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create creditor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ creditor: newCreditor[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating creditor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
