import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
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
    const { 
      location,
      budget,
      timePeriod,
      moodTags,
      dateType,
      itineraries
    } = body;

    // Generate a unique share code
    const shareCode = nanoid(8);

    // Store the duo date in database
    const { error } = await supabase
      .from('duo_dates')
      .insert({
        id: shareCode,
        created_by: userId,
        location,
        budget,
        time_period: timePeriod,
        mood_tags: moodTags,
        date_type: dateType,
        itineraries: itineraries,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating duo date:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create shareable duo date' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareCode,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/duo-date/${shareCode}`
    });
  } catch (error) {
    console.error('Error creating duo date share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shareable duo date' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shareCode = searchParams.get('code');

    if (!shareCode) {
      return NextResponse.json(
        { success: false, error: 'Share code required' },
        { status: 400 }
      );
    }

    // Get the duo date from database
    const { data, error } = await supabase
      .from('duo_dates')
      .select('*')
      .eq('id', shareCode)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Duo date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      duoDate: data
    });
  } catch (error) {
    console.error('Error fetching duo date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch duo date' },
      { status: 500 }
    );
  }
}
