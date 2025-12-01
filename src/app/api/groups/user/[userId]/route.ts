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
      .from('Member')
      .select(`
        groupId,
        Group (
          id,
          code,
          name,
          description,
          created_at,
          Member (
            id,
            name,
            location,
            budget,
            clerkUserId
          )
        )
      `)
      .eq('clerkUserId', userId);

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
      id: membership.Group?.id,
      code: membership.Group?.code,
      name: membership.Group?.name,
      description: membership.Group?.description,
      created_at: membership.Group?.created_at,
      members: membership.Group?.Member || []
    })) || [];

    // Also get vote counts and finalized index for each group
    const groupsWithVotes = await Promise.all(
      groups.map(async (group) => {
        try {
          // Get vote counts
          if (!supabase) return group;
          const { data: votes, error: voteError } = await supabase
            .from('ItineraryVotes')
            .select('itineraryIdx')
            .eq('groupId', group.id);

          if (voteError) {
            console.error('Error fetching votes for group:', group.id, voteError);
            return group;
          }

          // Count votes by itinerary index
          const voteCounts: Record<number, number> = {};
          votes?.forEach(vote => {
            voteCounts[vote.itineraryIdx] = (voteCounts[vote.itineraryIdx] || 0) + 1;
          });

          // Find finalized index (itinerary with most votes)
          let finalisedIdx: number | null = null;
          let maxVotes = 0;
          Object.entries(voteCounts).forEach(([idx, count]) => {
            if (count > maxVotes) {
              maxVotes = count;
              finalisedIdx = Number(idx);
            }
          });

          // Get cached locations if available
          const { data: itinerary } = await supabase
            .from('Itineraries')
            .select('locations')
            .eq('groupId', group.id)
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
