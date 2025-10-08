import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getIO } from '@/lib/io';

// Get group by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get group from Supabase
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        members (*)
      `)
      .eq('code', code)
      .single();

    if (error || !group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Optional notify listeners with a fresh payload (only if socket server is available)
    const io = getIO();
    if (io && !process.env.VERCEL) {
      io.to(group.id).emit('group-updated', group);
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';