import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Cast or update a vote for an itinerary
export async function POST(request: NextRequest) {
  try {
    const { groupId, memberId, itineraryIdx } = await request.json();
    if (!groupId || !memberId || itineraryIdx === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Remove any previous vote by this member in this group
    await prisma.itineraryVotes.deleteMany({
      where: { groupId, memberId }
    });

    // Add new vote
    await prisma.itineraryVotes.create({
      data: { groupId, memberId, itineraryIdx }
    });

    // Count votes for each itinerary
    const votes = await prisma.itineraryVotes.findMany({ where: { groupId } });
    const voteCounts: Record<number, number> = {};
    type Vote = {
      itineraryIdx: number;
      groupId: string;
      memberId: string;
    };
    (votes as Vote[]).forEach((v) => {
      voteCounts[v.itineraryIdx] = (voteCounts[v.itineraryIdx] || 0) + 1;
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

    return NextResponse.json({ success: true, voteCounts, finalisedIdx });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ success: false, error: 'Failed to vote' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
