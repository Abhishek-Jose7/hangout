import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Use imported supabase client

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Group code is required' },
        { status: 400 }
      );
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        code,
        name,
        description,
        created_at,
        members (
          id,
          name,
          location,
          budget,
          clerk_user_id
        )
      `)
      .eq('code', code)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        code: group.code,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        members: group.members || []
      }
    });

  } catch (error) {
    console.error('Error in GET /api/share/[code]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
