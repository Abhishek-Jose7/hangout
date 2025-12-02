import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
// Types defined inline

// GET: Fetch reviews for a hangout
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
    const hangoutId = url.searchParams.get('hangoutId');
    const placeId = url.searchParams.get('placeId');

    if (!hangoutId && !placeId) {
      return NextResponse.json(
        { success: false, error: 'Hangout ID or Place ID is required' },
        { status: 400 }
      );
    }

    // Fetch hangout reviews
    if (hangoutId) {
      const { data: reviews, error } = await supabase
        .from('HangoutReview')
        .select(`
          *,
          member:Member(id, name, clerkUserId)
        `)
        .eq('hangoutId', hangoutId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch reviews' },
          { status: 500 }
        );
      }

      // Get current user's review
      const { data: currentMember } = await supabase
        .from('Member')
        .select('id')
        .eq('clerkUserId', userId)
        .single();

      const userReview = currentMember 
        ? reviews?.find(r => r.memberId === currentMember.id)
        : null;

      // Calculate stats
      const avgRating = reviews?.length 
        ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
        : 0;
      const wouldRepeatCount = reviews?.filter(r => r.wouldRepeat).length || 0;

      return NextResponse.json({
        success: true,
        reviews: reviews || [],
        userReview,
        stats: {
          averageRating: avgRating,
          totalReviews: reviews?.length || 0,
          wouldRepeatPercentage: reviews?.length 
            ? Math.round(wouldRepeatCount / reviews.length * 100)
            : 0
        }
      });
    }

    // Fetch place reviews
    if (placeId) {
      const { data: reviews, error } = await supabase
        .from('PlaceReview')
        .select(`
          *,
          member:Member(id, name)
        `)
        .eq('placeId', placeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching place reviews:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch place reviews' },
          { status: 500 }
        );
      }

      const avgRating = reviews?.length 
        ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
        : 0;

      return NextResponse.json({
        success: true,
        reviews: reviews || [],
        stats: {
          averageRating: avgRating,
          totalReviews: reviews?.length || 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      reviews: []
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST: Create a review
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
    const { hangoutId, placeId, placeName, rating, feedback, review, wouldRepeat, highlights, improvements, photos } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get current member
    const { data: hangout } = hangoutId ? await supabase
      .from('Hangout')
      .select('groupId')
      .eq('id', hangoutId)
      .single() : { data: null };

    const _groupId = hangout?.groupId; // eslint-disable-line @typescript-eslint/no-unused-vars

    const { data: currentMember, error: memberError } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member to leave a review' },
        { status: 403 }
      );
    }

    // Create hangout review
    if (hangoutId && !placeId) {
      // Check for existing review
      const { data: existingReview } = await supabase
        .from('HangoutReview')
        .select('id')
        .eq('hangoutId', hangoutId)
        .eq('memberId', currentMember.id)
        .single();

      if (existingReview) {
        // Update existing review
        const { data: updatedReview, error: updateError } = await supabase
          .from('HangoutReview')
          .update({
            rating,
            feedback,
            wouldRepeat: wouldRepeat ?? true,
            highlights: highlights || [],
            improvements: improvements || []
          })
          .eq('id', existingReview.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating review:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update review' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          review: updatedReview,
          updated: true
        });
      }

      const { data: newReview, error: createError } = await supabase
        .from('HangoutReview')
        .insert({
          id: randomUUID(),
          hangoutId,
          memberId: currentMember.id,
          rating,
          feedback,
          wouldRepeat: wouldRepeat ?? true,
          highlights: highlights || [],
          improvements: improvements || []
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating review:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create review' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        review: newReview
      });
    }

    // Create place review
    if (placeId && hangoutId) {
      // Check for existing place review
      const { data: existingReview } = await supabase
        .from('PlaceReview')
        .select('id')
        .eq('hangoutId', hangoutId)
        .eq('memberId', currentMember.id)
        .eq('placeId', placeId)
        .single();

      if (existingReview) {
        const { data: updatedReview, error: updateError } = await supabase
          .from('PlaceReview')
          .update({
            rating,
            review,
            photos: photos || []
          })
          .eq('id', existingReview.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating place review:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update place review' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          review: updatedReview,
          updated: true
        });
      }

      const { data: newReview, error: createError } = await supabase
        .from('PlaceReview')
        .insert({
          id: randomUUID(),
          hangoutId,
          memberId: currentMember.id,
          placeId,
          placeName: placeName || 'Unknown Place',
          rating,
          review,
          photos: photos || []
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating place review:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create place review' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        review: newReview
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either hangoutId or both hangoutId and placeId are required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a review
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
    const reviewId = url.searchParams.get('reviewId');
    const type = url.searchParams.get('type') || 'hangout'; // 'hangout' or 'place'

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const { data: currentMember } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .single();

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const table = type === 'place' ? 'PlaceReview' : 'HangoutReview';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', reviewId)
      .eq('memberId', currentMember.id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
