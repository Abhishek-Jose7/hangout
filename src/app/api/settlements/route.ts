import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// GET: Fetch settlements for a group
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

    const { data: settlements, error } = await supabase
      .from('Settlement')
      .select(`
        *,
        fromMember:Member!fromMemberId(id, name, clerkUserId),
        toMember:Member!toMemberId(id, name, clerkUserId)
      `)
      .eq('groupId', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching settlements:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settlements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settlements: settlements || []
    });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}

// POST: Create a settlement (mark debt as paid)
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

    const body = await request.json();
    const { groupId, fromMemberId, toMemberId, amount, notes } = body;

    if (!groupId || !fromMemberId || !toMemberId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is a member
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

    // Create settlement
    const { data: settlement, error: createError } = await supabase
      .from('Settlement')
      .insert({
        id: randomUUID(),
        groupId,
        fromMemberId,
        toMemberId,
        amount,
        notes,
        status: 'pending'
      })
      .select(`
        *,
        fromMember:Member!fromMemberId(id, name),
        toMember:Member!toMemberId(id, name)
      `)
      .single();

    if (createError) {
      console.error('Error creating settlement:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create settlement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settlement
    });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create settlement' },
      { status: 500 }
    );
  }
}

// PUT: Update settlement status
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { settlementId, status } = body;

    if (!settlementId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify user is involved in settlement
    const { data: settlement, error: getError } = await supabase
      .from('Settlement')
      .select(`
        *,
        fromMember:Member!fromMemberId(clerkUserId),
        toMember:Member!toMemberId(clerkUserId)
      `)
      .eq('id', settlementId)
      .single();

    if (getError || !settlement) {
      return NextResponse.json(
        { success: false, error: 'Settlement not found' },
        { status: 404 }
      );
    }

    // Only involved parties can update
    if (settlement.fromMember?.clerkUserId !== userId && settlement.toMember?.clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You are not involved in this settlement' },
        { status: 403 }
      );
    }

    const updateData: { status: string; settled_at?: string } = { status };
    if (status === 'completed') {
      updateData.settled_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('Settlement')
      .update(updateData)
      .eq('id', settlementId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating settlement:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update settlement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settlement: updated
    });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settlement' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
