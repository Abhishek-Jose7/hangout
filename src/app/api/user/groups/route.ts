import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
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

    // Get all groups where the user is a member
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        members!inner (
          id,
          name,
          clerk_user_id
        )
      `)
      .eq('members.clerk_user_id', userId);

    if (error) {
      console.error('Error fetching user groups:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Format the response to include membership info
    const formattedGroups = groups?.map(group => ({
      ...group,
      isCreator: false, // We'll need to determine this differently
      memberCount: group.members?.length || 0,
      userMember: group.members?.[0] || null
    })) || [];

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
      totalCount: formattedGroups.length
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
