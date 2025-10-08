import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getIO } from '@/lib/io';

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

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { name, location, budget, groupId, moodTags, email } = payload;

    // Validate required fields
    if (!name || !location || budget === undefined || !groupId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member of this group
    const { data: existingMember, error: existingError } = await supabase
      .from('members')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('group_id', groupId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing member:', existingError);
      return NextResponse.json(
        { success: false, error: 'Failed to check membership' },
        { status: 500 }
      );
    }

    if (existingMember) {
      // Return existing member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
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
    const { data: member, error: createError } = await supabase
      .from('members')
      .insert({
        name,
        location,
        budget: parseFloat(budget.toString()),
        mood_tags: Array.isArray(moodTags) ? moodTags.join(',') : '',
        clerk_user_id: userId,
        email: email || null,
        group_id: groupId
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
      const { data: updatedGroup, error: updatedGroupError } = await supabase
        .from('groups')
        .select(`
          *,
          members (*)
        `)
        .eq('id', groupId)
        .single();

      if (!updatedGroupError && updatedGroup) {
        io.to(groupId).emit('member-joined', updatedGroup);
      }
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