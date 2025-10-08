import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import { getIO } from '@/lib/io';

// Check if Supabase client is available
if (!supabase) {
  throw new Error('Supabase client not configured');
}

// Generate a random 6-character code
function generateGroupCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

// Create a new group
export async function POST() {
  try {
    console.log('Creating new group...');

    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const code = generateGroupCode();
    console.log('Generated code:', code);

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Create the group in Supabase
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ code })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('Group created successfully:', group);

    // Emit group-updated for the new group room
    const io = getIO();
    if (io) {
      io.to(group.id).emit('group-updated', group);
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create group' },
      { status: 500 }
    );
  }
}

// Get all groups (for testing purposes)
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        members (*)
      `);

    if (error) {
      console.error('Error fetching groups:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, groups: groups || [] });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';