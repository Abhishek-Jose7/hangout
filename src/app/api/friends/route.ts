import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { FriendRequest } from '@/types/features';

// GET: Fetch user's friends
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
    const status = url.searchParams.get('status'); // 'pending', 'accepted', 'blocked'

    // Fetch friends where user is either userId or friendUserId
    let query1 = supabase
      .from('Friend')
      .select('*')
      .eq('userId', userId);

    let query2 = supabase
      .from('Friend')
      .select('*')
      .eq('friendUserId', userId);

    if (status) {
      query1 = query1.eq('status', status);
      query2 = query2.eq('status', status);
    }

    const [result1, result2] = await Promise.all([query1, query2]);

    const allFriends = [
      ...(result1.data || []).map(f => ({
        ...f,
        friendId: f.friendUserId,
        isOutgoing: true
      })),
      ...(result2.data || []).map(f => ({
        ...f,
        friendId: f.userId,
        isOutgoing: false
      }))
    ];

    // Separate by status
    const accepted = allFriends.filter(f => f.status === 'accepted');
    const pending = allFriends.filter(f => f.status === 'pending');
    const blocked = allFriends.filter(f => f.status === 'blocked');

    // Get pending requests (where current user is friendUserId)
    const incomingRequests = pending.filter(f => !f.isOutgoing);
    const outgoingRequests = pending.filter(f => f.isOutgoing);

    return NextResponse.json({
      success: true,
      friends: accepted,
      incomingRequests,
      outgoingRequests,
      blocked,
      counts: {
        friends: accepted.length,
        incomingRequests: incomingRequests.length,
        outgoingRequests: outgoingRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST: Send friend request
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

    const body: FriendRequest = await request.json();
    const { friendUserId } = body;

    if (!friendUserId) {
      return NextResponse.json(
        { success: false, error: 'Friend user ID is required' },
        { status: 400 }
      );
    }

    if (friendUserId === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    // Check for existing relationship
    const { data: existing } = await supabase
      .from('Friend')
      .select('id, status')
      .or(`and(userId.eq.${userId},friendUserId.eq.${friendUserId}),and(userId.eq.${friendUserId},friendUserId.eq.${userId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Already friends' },
          { status: 400 }
        );
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Friend request already pending' },
          { status: 400 }
        );
      }
      if (existing.status === 'blocked') {
        return NextResponse.json(
          { success: false, error: 'Cannot send request to this user' },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const { data: friend, error: createError } = await supabase
      .from('Friend')
      .insert({
        id: randomUUID(),
        userId,
        friendUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating friend request:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to send friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      friend
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// PUT: Accept/reject friend request
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
    const { friendId, action } = body; // action: 'accept', 'reject', 'block'

    if (!friendId || !action) {
      return NextResponse.json(
        { success: false, error: 'Friend ID and action are required' },
        { status: 400 }
      );
    }

    // Get the friend record
    const { data: friendRecord, error: getError } = await supabase
      .from('Friend')
      .select('*')
      .eq('id', friendId)
      .single();

    if (getError || !friendRecord) {
      return NextResponse.json(
        { success: false, error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Verify user is the recipient
    if (friendRecord.friendUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify this friend request' },
        { status: 403 }
      );
    }

    let newStatus: string;
    let updateData: { status: string; accepted_at?: string } = { status: '' };

    switch (action) {
      case 'accept':
        newStatus = 'accepted';
        updateData = { status: newStatus, accepted_at: new Date().toISOString() };
        break;
      case 'reject':
        // Delete the request
        await supabase.from('Friend').delete().eq('id', friendId);
        return NextResponse.json({ success: true, action: 'rejected' });
      case 'block':
        newStatus = 'blocked';
        updateData = { status: newStatus };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data: updated, error: updateError } = await supabase
      .from('Friend')
      .update(updateData)
      .eq('id', friendId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating friend:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      friend: updated,
      action
    });
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update friend request' },
      { status: 500 }
    );
  }
}

// DELETE: Remove friend or cancel request
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
    const friendId = url.searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json(
        { success: false, error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // Verify user is part of this friendship
    const { data: friendRecord } = await supabase
      .from('Friend')
      .select('*')
      .eq('id', friendId)
      .single();

    if (!friendRecord) {
      return NextResponse.json(
        { success: false, error: 'Friend not found' },
        { status: 404 }
      );
    }

    if (friendRecord.userId !== userId && friendRecord.friendUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove this friend' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('Friend')
      .delete()
      .eq('id', friendId);

    if (deleteError) {
      console.error('Error removing friend:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove friend' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
