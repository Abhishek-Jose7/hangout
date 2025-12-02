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
          itineraryIdx: v.itineraryIdx,
          rank: v.rank
        }))
      : [];

    // Calculate results using Borda count method
    // Points: 1st choice = 5pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts, 5th = 1pt
    const results: Record<number, {
      totalPoints: number;
      firstChoiceVotes: number;
      secondChoiceVotes: number;
      thirdChoiceVotes: number;
      voters: string[];
    }> = {};

    votes?.forEach(vote => {
      if (!results[vote.itineraryIdx]) {
        results[vote.itineraryIdx] = {
          totalPoints: 0,
          firstChoiceVotes: 0,
          secondChoiceVotes: 0,
          thirdChoiceVotes: 0,
          voters: []
        };
      }

      // Borda count: higher rank = more points
      const points = Math.max(0, 6 - vote.rank); // 1st=5, 2nd=4, 3rd=3, etc.
      results[vote.itineraryIdx].totalPoints += points;

      if (vote.rank === 1) results[vote.itineraryIdx].firstChoiceVotes++;
      if (vote.rank === 2) results[vote.itineraryIdx].secondChoiceVotes++;
      if (vote.rank === 3) results[vote.itineraryIdx].thirdChoiceVotes++;

      if (vote.member?.name && !results[vote.itineraryIdx].voters.includes(vote.member.name)) {
        results[vote.itineraryIdx].voters.push(vote.member.name);
      }
    });

    // Sort by total points
    const sortedResults = Object.entries(results)
      .map(([idx, data]) => ({
        itineraryIdx: parseInt(idx),
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
    const { groupId, votes } = body;

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
      itineraryIdx: v.itineraryIdx,
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

    // Fetch updated results
    const { data: allVotes } = await supabase
      .from('RankedVote')
      .select('*')
      .eq('groupId', groupId);

    // Recalculate results
    const results: Record<number, { totalPoints: number; firstChoiceVotes: number }> = {};
    allVotes?.forEach(vote => {
      if (!results[vote.itineraryIdx]) {
        results[vote.itineraryIdx] = { totalPoints: 0, firstChoiceVotes: 0 };
      }
      results[vote.itineraryIdx].totalPoints += Math.max(0, 6 - vote.rank);
      if (vote.rank === 1) results[vote.itineraryIdx].firstChoiceVotes++;
    });

    const sortedResults = Object.entries(results)
      .map(([idx, data]) => ({ itineraryIdx: parseInt(idx), ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.firstChoiceVotes - a.firstChoiceVotes);

    return NextResponse.json({
      success: true,
      votes: voteRecords,
      results: sortedResults,
      winner: sortedResults[0] || null
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
