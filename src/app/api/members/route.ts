import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getIO } from '@/lib/io';
import { randomUUID } from 'crypto';

// Create a new member
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set up environment variables.' },
        { status: 500 }
      );
    }

    console.log('POST /api/members - Starting request processing');

    const { userId } = await auth();
    console.log('Clerk auth result - userId:', userId);

    if (!userId) {
      console.error('Authentication failed - no userId from Clerk');
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log('Request payload received:', { ...payload, clerkUserId: userId });
    const { name, location, budget, groupId, moodTags, email } = payload;

    // Validate required fields
    if (!name || !location || budget === undefined || !groupId) {
      console.error('Missing required fields:', { name, location, budget, groupId });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, location, budget, and groupId are required' },
        { status: 400 }
      );
    }

    // Validate budget is a valid number
    const budgetNum = parseFloat(budget.toString());
    if (isNaN(budgetNum) || budgetNum < 0) {
      console.error('Invalid budget:', budget);
      return NextResponse.json(
        { success: false, error: 'Budget must be a valid positive number' },
        { status: 400 }
      );
    }

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('Group')
      .select('id')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error checking group existence:', groupError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify group existence' },
        { status: 500 }
      );
    }

    if (!group) {
      console.error('Group not found:', groupId);
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member of this group
    console.log('Checking existing membership for user:', userId, 'in group:', groupId);

    const { data: existingMember, error: existingError } = await supabase
      .from('Member')
      .select('id, name, clerkUserId')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing member:', {
        error: existingError,
        code: existingError.code,
        message: existingError.message,
        details: existingError.details,
        hint: existingError.hint,
        userId,
        groupId
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to check membership: ${existingError.message || 'Unknown error'}`,
          details: existingError.code
        },
        { status: 500 }
      );
    }

    if (existingMember) {
      console.log('User is already a member of this group:', existingMember);
      // Return existing member data
      const { data: memberData, error: memberError } = await supabase
        .from('Member')
        .select('*')
        .eq('id', existingMember.id)
        .single();

      if (memberError) {
        console.error('Error fetching existing member:', memberError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch member data' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, member: memberData, message: 'Already a member of this group' },
        { status: 200 }
      );
    }

    // Create member in Supabase
    console.log('Creating new member for user:', userId);

    const { data: member, error: createError } = await supabase
      .from('Member')
      .insert({
        id: randomUUID(),
        name: name.trim(),
        location: location.trim(),
        budget: budgetNum,
        moodTags: Array.isArray(moodTags) ? moodTags.join(',') : (moodTags || ''),
        clerkUserId: userId,
        email: email || null,
        groupId: groupId
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating member:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    // Emit member-joined with updated group payload (only if socket server is available)
    const io = getIO();
    if (io && !process.env.VERCEL) {
      // Get updated group data in parallel (don't await to avoid blocking response)
      (async () => {
        try {
          const { data: groupData, error: groupError } = await supabase
            .from('Group')
            .select('code')
            .eq('id', groupId)
            .single();

          if (!groupError && groupData) {
            io.to(groupId).emit('member-joined', {
              groupCode: groupData.code,
              member: member
            });

            // Also emit group-updated to ensure full state consistency
            const { data: updatedGroup } = await supabase
              .from('Group')
              .select(`
              *,
              Member (*)
            `)
              .eq('id', groupId)
              .single();

            if (updatedGroup) {
              io.to(groupId).emit('group-updated', updatedGroup);
            }
          }
        } catch (error) {
          console.error('Error fetching updated group for socket emission:', error);
        }
      })();
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';