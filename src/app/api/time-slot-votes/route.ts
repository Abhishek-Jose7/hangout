import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { TimeSlotVoteRequest } from '@/types/features';

// POST: Vote on a time slot
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

    const body: TimeSlotVoteRequest = await request.json();
    const { timeSlotId, availability } = body;

    if (!timeSlotId || !availability) {
      return NextResponse.json(
        { success: false, error: 'Time slot ID and availability are required' },
        { status: 400 }
      );
    }

    if (!['yes', 'maybe', 'no'].includes(availability)) {
      return NextResponse.json(
        { success: false, error: 'Invalid availability value' },
        { status: 400 }
      );
    }

    // Get time slot to find group
    const { data: timeSlot, error: slotError } = await supabase
      .from('TimeSlot')
      .select('groupId')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Get current member
    const { data: currentMember, error: memberError } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', timeSlot.groupId)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group' },
        { status: 403 }
      );
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('TimeSlotVote')
      .select('id')
      .eq('timeSlotId', timeSlotId)
      .eq('memberId', currentMember.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { data: updatedVote, error: updateError } = await supabase
        .from('TimeSlotVote')
        .update({
          availability,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating vote:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        vote: updatedVote,
        updated: true
      });
    }

    // Create new vote
    const { data: newVote, error: createError } = await supabase
      .from('TimeSlotVote')
      .insert({
        id: randomUUID(),
        timeSlotId,
        memberId: currentMember.id,
        availability
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating vote:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote: newVote
    });
  } catch (error) {
    console.error('Error voting on time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    );
  }
}

// DELETE: Remove vote from a time slot
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

    // Get time slot to find group
    const { data: timeSlot } = await supabase
      .from('TimeSlot')
      .select('groupId')
      .eq('id', timeSlotId)
      .single();

    if (!timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Get current member
    const { data: currentMember } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', timeSlot.groupId)
      .single();

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Delete vote
    const { error: deleteError } = await supabase
      .from('TimeSlotVote')
      .delete()
      .eq('timeSlotId', timeSlotId)
      .eq('memberId', currentMember.id);

    if (deleteError) {
      console.error('Error deleting vote:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vote' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
