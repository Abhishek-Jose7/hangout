import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { InvitationRequest } from '@/types/features';

// GET: Fetch invitations for a group
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

    const { data: invitations, error } = await supabase
      .from('Invitation')
      .select(`
        *,
        invitedBy:Member!invitedById(id, name)
      `)
      .eq('groupId', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Separate by status
    const pending = invitations?.filter(i => i.status === 'pending') || [];
    const accepted = invitations?.filter(i => i.status === 'accepted') || [];
    const declined = invitations?.filter(i => i.status === 'declined') || [];
    const expired = invitations?.filter(i => i.status === 'expired' || 
      (i.expiresAt && new Date(i.expiresAt) < new Date())) || [];

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
      stats: {
        pending: pending.length,
        accepted: accepted.length,
        declined: declined.length,
        expired: expired.length
      }
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST: Create an invitation
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

    const body: InvitationRequest = await request.json();
    const { groupId, method, invitedEmail, invitedPhone, invitedUserId } = body;

    if (!groupId || !method) {
      return NextResponse.json(
        { success: false, error: 'Group ID and method are required' },
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

    // Get group info for share link
    const { data: group } = await supabase
      .from('Group')
      .select('code, name')
      .eq('id', groupId)
      .single();

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error: createError } = await supabase
      .from('Invitation')
      .insert({
        id: randomUUID(),
        groupId,
        invitedById: currentMember.id,
        invitedEmail,
        invitedPhone,
        invitedUserId,
        method,
        status: 'pending',
        expiresAt: expiresAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Generate share messages based on method
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hangout.app'}/share/${group?.code}`;
    const groupName = group?.name || `Group ${group?.code}`;
    
    let shareMessage = '';
    let shareUrl = '';

    switch (method) {
      case 'whatsapp':
        shareMessage = encodeURIComponent(
          `Hey! Join my hangout group "${groupName}" on Hangout Planner. Click here to join: ${shareLink}`
        );
        shareUrl = `https://wa.me/${invitedPhone?.replace(/\D/g, '')}?text=${shareMessage}`;
        break;
      case 'email':
        shareMessage = `Join my hangout group "${groupName}"! Click here: ${shareLink}`;
        shareUrl = `mailto:${invitedEmail}?subject=Join my Hangout Group&body=${encodeURIComponent(shareMessage)}`;
        break;
      case 'link':
        shareUrl = shareLink;
        break;
      default:
        shareUrl = shareLink;
    }

    return NextResponse.json({
      success: true,
      invitation,
      shareLink,
      shareUrl,
      shareMessage: decodeURIComponent(shareMessage || shareLink)
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// PUT: Update invitation status
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
    const { invitationId, status } = body;

    if (!invitationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID and status are required' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('Invitation')
      .update({ status })
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: updated
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invitation' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
