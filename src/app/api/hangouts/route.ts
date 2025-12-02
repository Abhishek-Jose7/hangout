import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// GET: Fetch hangouts (history) for a user or group
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
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let query = supabase
      .from('Hangout')
      .select(`
        *,
        group:Group(id, code, name),
        reviews:HangoutReview(
          id, rating, feedback, wouldRepeat, highlights, improvements,
          member:Member(id, name)
        ),
        placeReviews:PlaceReview(
          id, placeId, placeName, rating, review, photos,
          member:Member(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (groupId) {
      query = query.eq('groupId', groupId);
    } else {
      // Get all hangouts for groups the user is a member of
      const { data: userGroups } = await supabase
        .from('Member')
        .select('groupId')
        .eq('clerkUserId', userId);

      if (userGroups?.length) {
        query = query.in('groupId', userGroups.map(g => g.groupId));
      } else {
        return NextResponse.json({
          success: true,
          hangouts: [],
          stats: null
        });
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: hangouts, error } = await query;

    if (error) {
      console.error('Error fetching hangouts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch hangouts' },
        { status: 500 }
      );
    }

    // Calculate stats
    const completedHangouts = hangouts?.filter(h => h.status === 'completed') || [];
    const allRatings = completedHangouts.flatMap(h => h.reviews?.map((r: { rating: number }) => r.rating) || []);
    
    const stats = {
      totalHangouts: hangouts?.length || 0,
      completedHangouts: completedHangouts.length,
      totalSpent: completedHangouts.reduce((sum, h) => sum + (h.totalSpent || 0), 0),
      averageRating: allRatings.length > 0 
        ? Math.round(allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length * 10) / 10
        : 0,
      upcomingHangouts: hangouts?.filter(h => h.status === 'planned').length || 0
    };

    return NextResponse.json({
      success: true,
      hangouts: hangouts || [],
      stats
    });
  } catch (error) {
    console.error('Error fetching hangouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hangouts' },
      { status: 500 }
    );
  }
}

// POST: Create a hangout (complete a group plan)
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
    const { groupId, title, description, selectedItineraryIdx, itineraryData, startDate, endDate, status } = body;

    if (!groupId || !title) {
      return NextResponse.json(
        { success: false, error: 'Group ID and title are required' },
        { status: 400 }
      );
    }

    // Verify user is a member
    const { data: member, error: memberError } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group' },
        { status: 403 }
      );
    }

    const { data: hangout, error } = await supabase
      .from('Hangout')
      .insert({
        id: randomUUID(),
        groupId,
        title,
        description,
        selectedItineraryIdx,
        itineraryData,
        startDate,
        endDate,
        status: status || 'planned'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hangout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create hangout' },
        { status: 500 }
      );
    }

    // Update group status
    await supabase
      .from('Group')
      .update({ 
        status: status || 'planning',
        finalItineraryIdx: selectedItineraryIdx,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    return NextResponse.json({
      success: true,
      hangout
    });
  } catch (error) {
    console.error('Error creating hangout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hangout' },
      { status: 500 }
    );
  }
}

// PUT: Update hangout status
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
    const { hangoutId, status, totalSpent } = body;

    if (!hangoutId) {
      return NextResponse.json(
        { success: false, error: 'Hangout ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (totalSpent !== undefined) updateData.totalSpent = totalSpent;

    const { data: hangout, error } = await supabase
      .from('Hangout')
      .update(updateData)
      .eq('id', hangoutId)
      .select()
      .single();

    if (error) {
      console.error('Error updating hangout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update hangout' },
        { status: 500 }
      );
    }

    // Update group status if hangout is completed
    if (status === 'completed' && hangout?.groupId) {
      await supabase
        .from('Group')
        .update({ 
          status: 'completed',
          actualSpent: totalSpent || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', hangout.groupId);
    }

    return NextResponse.json({
      success: true,
      hangout
    });
  } catch (error) {
    console.error('Error updating hangout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hangout' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
