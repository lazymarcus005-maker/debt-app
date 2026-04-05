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

    // Get savings goals for user
    const { data: savings, error } = await supabase
      .from('savings')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch savings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ savings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching savings:', error);
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
      goal_name,
      category,
      target_amount,
      current_amount = 0,
      target_date,
      description
    } = body;

    if (!goal_name || !category || !target_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newSaving, error } = await supabase
      .from('savings')
      .insert([
        {
          user_id: decoded.userId,
          goal_name,
          category,
          target_amount,
          current_amount,
          target_date,
          description,
          is_active: true
        }
      ])
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create savings goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saving: newSaving[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating savings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
