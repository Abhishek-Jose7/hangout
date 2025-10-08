import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set up environment variables.' },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('group_id', groupId)
      .single();

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group to clear itineraries' },
        { status: 403 }
      );
    }

    // Delete all itineraries for this group
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('group_id', groupId);

    if (error) {
      console.error('Error clearing itineraries:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to clear itineraries' },
        { status: 500 }
      );
    }

    console.log('Successfully cleared itineraries for group:', groupId);
    return NextResponse.json({ success: true, message: 'Itineraries cleared successfully' });
  } catch (error) {
    console.error('Error clearing itineraries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear itineraries' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
