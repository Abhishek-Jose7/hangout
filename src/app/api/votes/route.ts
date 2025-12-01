import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// POST: Cast or update a vote for an itinerary
export async function POST(request: NextRequest) {
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

    const { groupId, memberId, itineraryIdx } = await request.json();

    if (!groupId || !memberId || itineraryIdx === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Remove any previous vote by this member in this group
    const { error: deleteError } = await supabase
      .from('ItineraryVotes')
      .delete()
      .eq('groupId', groupId)
      .eq('memberId', memberId);

    if (deleteError) {
      console.error('Error deleting previous vote:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to update vote' }, { status: 500 });
    }

    // Add new vote
    const { error: createError } = await supabase
      .from('ItineraryVotes')
      .insert({
        groupId: groupId,
        memberId: memberId,
        itineraryIdx: itineraryIdx
      });

    if (createError) {
      console.error('Error creating vote:', createError);
      return NextResponse.json({ success: false, error: 'Failed to create vote' }, { status: 500 });
    }

    // Count votes for each itinerary
    const { data: votes, error: votesError } = await supabase
      .from('ItineraryVotes')
      .select('itineraryIdx')
      .eq('groupId', groupId);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return NextResponse.json({ success: false, error: 'Failed to fetch votes' }, { status: 500 });
    }

    const voteCounts: Record<number, number> = {};
    votes?.forEach((vote) => {
      voteCounts[vote.itineraryIdx] = (voteCounts[vote.itineraryIdx] || 0) + 1;
    });

    // Find the itinerary with the most votes
    let maxVotes = 0;
    let finalisedIdx: number | null = null;
    Object.entries(voteCounts).forEach(([idx, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        finalisedIdx = Number(idx);
      }
    });

    // Emit vote update via socket (non-blocking)
    (async () => {
      try {
        const { getIO } = await import('@/lib/io');
        const io = getIO();
        if (io && !process.env.VERCEL) {
          // Get group code for socket emission
          const { data: group } = await supabase
            .from('Group')
            .select('code')
            .eq('id', groupId)
            .single();

          if (group) {
            io.to(groupId).emit('vote-updated', {
              groupCode: group.code,
              voteCounts,
              finalisedIdx
            });
            console.log('Vote update emitted to group:', groupId, voteCounts);
          }
        }
      } catch (error) {
        console.error('Socket emission error:', error);
      }
    })();

    return NextResponse.json({ success: true, voteCounts, finalisedIdx });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ success: false, error: 'Failed to vote' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
