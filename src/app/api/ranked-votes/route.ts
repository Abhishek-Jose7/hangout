import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { RankedVoteRequest } from '@/types/features';

// GET: Fetch ranked votes and calculate results
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
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

    // Fetch all ranked votes for the group
    const { data: votes, error: voteError } = await supabase
      .from('RankedVote')
      .select(`
        *,
        member:Member(id, name, clerkUserId)
      `)
      .eq('groupId', groupId);

    if (voteError) {
      console.error('Error fetching ranked votes:', voteError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    // Get current user's votes
    const { data: currentMember } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    const userVotes = currentMember
      ? votes?.filter(v => v.memberId === currentMember.id).map(v => ({
        itemId: v.itemId, // Updated to use itemId
        itineraryIdx: v.itineraryIdx, // Keep for backward compatibility
        rank: v.rank
      }))
      : [];

    // Calculate results using Borda count method (aggregated by itemId)
    // Points: 1st choice = 5pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts, 5th = 1pt
    const results: Record<string, {
      totalPoints: number;
      firstChoiceVotes: number;
      secondChoiceVotes: number;
      thirdChoiceVotes: number;
      voters: string[];
    }> = {};

    votes?.forEach(vote => {
      // Use itemId as key if available, fallback to index for old votes
      const key = vote.itemId || `idx_${vote.itineraryIdx}`;

      if (!results[key]) {
        results[key] = {
          totalPoints: 0,
          firstChoiceVotes: 0,
          secondChoiceVotes: 0,
          thirdChoiceVotes: 0,
          voters: []
        };
      }

      // Borda count: higher rank = more points
      const points = Math.max(0, 6 - vote.rank); // 1st=5, 2nd=4, 3rd=3, etc.
      results[key].totalPoints += points;

      if (vote.rank === 1) results[key].firstChoiceVotes++;
      if (vote.rank === 2) results[key].secondChoiceVotes++;
      if (vote.rank === 3) results[key].thirdChoiceVotes++;

      if (vote.member?.name && !results[key].voters.includes(vote.member.name)) {
        results[key].voters.push(vote.member.name);
      }
    });

    // Sort by total points
    const sortedResults = Object.entries(results)
      .map(([key, data]) => ({
        itemId: key.startsWith('idx_') ? undefined : key,
        itineraryIdx: key.startsWith('idx_') ? parseInt(key.replace('idx_', '')) : undefined,
        ...data
      }))
      .sort((a, b) => {
        // Primary sort by total points
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        // Tiebreaker: first choice votes
        return b.firstChoiceVotes - a.firstChoiceVotes;
      });

    // Get unique voters count
    const uniqueVoters = new Set(votes?.map(v => v.memberId)).size;

    return NextResponse.json({
      success: true,
      votes: votes || [],
      userVotes,
      results: sortedResults,
      winner: sortedResults[0] || null,
      totalVoters: uniqueVoters
    });
  } catch (error) {
    console.error('Error fetching ranked votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

// POST: Submit ranked votes
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
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

    const body: RankedVoteRequest = await request.json();
    const { groupId, votes, snapshotId } = body;

    if (!groupId || !votes || !Array.isArray(votes)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate votes
    const ranks = votes.map(v => v.rank);
    const uniqueRanks = new Set(ranks);
    if (ranks.length !== uniqueRanks.size) {
      return NextResponse.json(
        { success: false, error: 'Each rank can only be used once' },
        { status: 400 }
      );
    }

    // Get the current member
    const { data: currentMember, error: memberError } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group' },
        { status: 403 }
      );
    }

    // Delete existing votes from this member
    await supabase
      .from('RankedVote')
      .delete()
      .eq('groupId', groupId)
      .eq('memberId', currentMember.id);

    // Insert new votes
    const voteRecords = votes.map(v => ({
      id: randomUUID(),
      groupId,
      memberId: currentMember.id,
      itemId: v.itemId, // New core identifier
      itineraryIdx: v.itineraryIdx, // Optional backward compat
      snapshotId: snapshotId, // New tracking for snapshot version
      rank: v.rank
    }));

    const { error: insertError } = await supabase
      .from('RankedVote')
      .insert(voteRecords);

    if (insertError) {
      console.error('Error inserting ranked votes:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit votes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      votes: voteRecords,
      message: 'Votes cast successfully'
    });
  } catch (error) {
    console.error('Error submitting ranked votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit votes' },
      { status: 500 }
    );
  }
}

// DELETE: Clear user's ranked votes
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
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

    const { data: currentMember } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group' },
        { status: 403 }
      );
    }

    await supabase
      .from('RankedVote')
      .delete()
      .eq('groupId', groupId)
      .eq('memberId', currentMember.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ranked votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete votes' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
