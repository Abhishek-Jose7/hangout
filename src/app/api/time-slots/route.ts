import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { TimeSlotRequest } from '@/types/features';

// GET: Fetch time slots for a group
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

    // Fetch time slots with votes
    const { data: timeSlots, error } = await supabase
      .from('TimeSlot')
      .select(`
        *,
        proposedBy:Member!proposedById(id, name),
        votes:TimeSlotVote(
          id, availability,
          member:Member(id, name, clerkUserId)
        )
      `)
      .eq('groupId', groupId)
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    // Get current user's member ID
    const { data: currentMember } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    // Calculate summaries for each time slot
    const summaries = timeSlots?.map(slot => {
      const votes = slot.votes || [];
      const yesCount = votes.filter((v: { availability: string }) => v.availability === 'yes').length;
      const maybeCount = votes.filter((v: { availability: string }) => v.availability === 'maybe').length;
      const noCount = votes.filter((v: { availability: string }) => v.availability === 'no').length;
      const score = yesCount * 2 + maybeCount; // yes = 2pts, maybe = 1pt, no = 0

      // Get current user's vote for this slot
      const userVote = currentMember 
        ? votes.find((v: { member?: { clerkUserId?: string } }) => v.member?.clerkUserId === userId)?.availability
        : null;

      return {
        timeSlot: {
          ...slot,
          votes: undefined // Remove votes from response to avoid duplication
        },
        yesCount,
        maybeCount,
        noCount,
        totalResponses: votes.length,
        score,
        userVote,
        voters: votes.map((v: { member?: { name?: string }; availability: string }) => ({
          name: v.member?.name,
          availability: v.availability
        }))
      };
    }) || [];

    // Sort by score (best options first)
    summaries.sort((a, b) => b.score - a.score);

    // Find the best slot (highest score with at least 2 yes votes)
    const bestSlot = summaries.find(s => s.yesCount >= 2) || summaries[0];

    return NextResponse.json({
      success: true,
      timeSlots: summaries,
      bestSlot: bestSlot || null,
      totalSlots: summaries.length
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

// POST: Create a new time slot
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

    const body: TimeSlotRequest = await request.json();
    const { groupId, startTime, endTime, title, isRecurring, recurringPattern } = body;

    if (!groupId || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Group ID, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Get current member
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

    // Create time slot
    const { data: timeSlot, error: createError } = await supabase
      .from('TimeSlot')
      .insert({
        id: randomUUID(),
        groupId,
        proposedById: currentMember.id,
        startTime,
        endTime,
        title,
        isRecurring: isRecurring || false,
        recurringPattern: isRecurring ? recurringPattern : null
      })
      .select(`
        *,
        proposedBy:Member!proposedById(id, name)
      `)
      .single();

    if (createError) {
      console.error('Error creating time slot:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create time slot' },
        { status: 500 }
      );
    }

    // Auto-vote "yes" for the proposer
    await supabase
      .from('TimeSlotVote')
      .insert({
        id: randomUUID(),
        timeSlotId: timeSlot.id,
        memberId: currentMember.id,
        availability: 'yes'
      });

    return NextResponse.json({
      success: true,
      timeSlot
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a time slot
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
    const timeSlotId = url.searchParams.get('timeSlotId');

    if (!timeSlotId) {
      return NextResponse.json(
        { success: false, error: 'Time slot ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: timeSlot, error: getError } = await supabase
      .from('TimeSlot')
      .select(`
        *,
        proposedBy:Member!proposedById(clerkUserId)
      `)
      .eq('id', timeSlotId)
      .single();

    if (getError || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Time slot not found' },
        { status: 404 }
      );
    }

    if (timeSlot.proposedBy?.clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete time slots you created' },
        { status: 403 }
      );
    }

    // Delete time slot (cascades to votes)
    const { error: deleteError } = await supabase
      .from('TimeSlot')
      .delete()
      .eq('id', timeSlotId);

    if (deleteError) {
      console.error('Error deleting time slot:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete time slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete time slot' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
