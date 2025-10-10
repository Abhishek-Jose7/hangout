import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Use imported supabase client

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all groups where the user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('members')
      .select(`
        group_id,
        groups (
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
        )
      `)
      .eq('clerk_user_id', userId);

    if (membershipError) {
      console.error('Error fetching user groups:', membershipError);
      return NextResponse.json(
        { success: false, error: membershipError.message },
        { status: 500 }
      );
    }

    // Transform the data to match our Group interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = memberships?.map((membership: any) => ({
      id: membership.groups?.id,
      code: membership.groups?.code,
      name: membership.groups?.name,
      description: membership.groups?.description,
      created_at: membership.groups?.created_at,
      members: membership.groups?.members || []
    })) || [];

    // Also get vote counts and finalized index for each group
    const groupsWithVotes = await Promise.all(
      groups.map(async (group) => {
        try {
          // Get vote counts
          if (!supabase) return group;
          const { data: votes, error: voteError } = await supabase
            .from('votes')
            .select('itinerary_idx')
            .eq('group_id', group.id);

          if (voteError) {
            console.error('Error fetching votes for group:', group.id, voteError);
            return group;
          }

          // Count votes by itinerary index
          const voteCounts: Record<string, number> = {};
          votes?.forEach(vote => {
            const key = `itinerary_${vote.itinerary_idx}`;
            voteCounts[key] = (voteCounts[key] || 0) + 1;
          });

          // Find finalized index (itinerary with most votes)
          let finalisedIdx: number | null = null;
          if (Object.keys(voteCounts).length > 0) {
            const maxVotes = Math.max(...Object.values(voteCounts));
            const winningKey = Object.keys(voteCounts).find(key => voteCounts[key] === maxVotes);
            if (winningKey) {
              finalisedIdx = parseInt(winningKey.replace('itinerary_', ''));
            }
          }

          // Get cached locations if available
          const { data: itinerary } = await supabase
            .from('itineraries')
            .select('locations')
            .eq('group_id', group.id)
            .single();

          return {
            ...group,
            voteCounts,
            finalisedIdx,
            locations: itinerary?.locations || null
          };
        } catch (error) {
          console.error('Error processing group votes:', group.id, error);
          return group;
        }
      })
    );

    return NextResponse.json({
      success: true,
      groups: groupsWithVotes
    });

  } catch (error) {
    console.error('Error in GET /api/groups/user/[userId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
