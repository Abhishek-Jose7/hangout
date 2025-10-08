import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Check if Supabase client is available
if (!supabase) {
  throw new Error('Supabase client not configured');
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Test database connection by querying groups
    const { count: groupCount, error } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      groupCount: groupCount || 0,
      database: 'Supabase (PostgreSQL)',
      authentication: 'Clerk'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
        note: 'Make sure Supabase is properly configured with your database schema'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
