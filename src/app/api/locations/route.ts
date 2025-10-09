import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { findOptimalLocations } from '@/lib/gemini';

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // First, check if itineraries already exist for this group
    console.log('Checking for existing itineraries for group:', groupId);
    const { data: existingItineraries, error: itineraryError } = await supabase
      .from('itineraries')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (itineraryError) {
      console.error('Error fetching existing itineraries:', itineraryError);
    }

    // If itineraries exist, return them
    if (existingItineraries && existingItineraries.length > 0) {
      console.log('Returning cached itineraries for group:', groupId, 'created at:', existingItineraries[0].created_at);
      return NextResponse.json({
        success: true,
        locations: existingItineraries[0].locations,
        cached: true,
        createdAt: existingItineraries[0].created_at
      });
    }

    console.log('No cached itineraries found, generating new ones for group:', groupId);

    // Get all members of the group from Supabase
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No members found in this group' },
        { status: 404 }
      );
    }
    
    // Format members for the Gemini API
    const formattedMembers = members.map((member: { name: string; location: string; budget: number; mood_tags: string; preferred_date: string | null }) => ({
      name: member.name,
      location: member.location,
      budget: member.budget,
      moodTags: member.mood_tags && member.mood_tags.length > 0
        ? member.mood_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [],
      preferredDate: member.preferred_date || null
    }));
    
    // Get optimal locations using Gemini API
    let locations = [];
    try {
      const locationsResult = await findOptimalLocations(formattedMembers);
      locations = locationsResult.locations || [];
    } catch (geminiError: unknown) {
      console.error('Gemini API error:', geminiError);
      
      // Check if it's a quota error
      if (geminiError instanceof Error && geminiError.message && geminiError.message.includes('quota')) {
        return NextResponse.json({
          success: false,
          error: 'AI service quota exceeded. Please try again later or contact support.',
          quotaExceeded: true,
          retryAfter: 3600 // 1 hour
        }, { status: 429 });
      }
      
      // For other errors, return a generic message
      return NextResponse.json({
        success: false,
        error: 'Failed to generate location suggestions. Please try again later.'
      }, { status: 500 });
    }

    // Google Maps API key
    const MAPS_API_KEY = "AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU";
    if (!MAPS_API_KEY) {
      return NextResponse.json({ success: false, error: 'MAPS_API_KEY not set' }, { status: 500 });
    }

    // Helper function to get coordinates for a location using Google Geocoding API
    async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
      try {
        const encodedLocation = encodeURIComponent(locationName);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return { lat: location.lat, lng: location.lng };
        }
        return null;
      } catch (error) {
        console.error('Error geocoding location:', error);
        return null;
      }
    }

    // Helper function to calculate distance between two coordinates
    function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    }

    // Helper to fetch place details from Google Maps Places API
    async function fetchPlaceDetails(placeName: string, location: string) {
      const query = encodeURIComponent(`${placeName} near ${location}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return {
          address: place.formatted_address || '',
          rating: place.rating || null,
          photos: place.photos ? place.photos.slice(0, 2).map((p: { photo_reference: string }) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${MAPS_API_KEY}`) : [],
          priceLevel: place.price_level || null,
          name: place.name || placeName
        };
      } else {
        console.warn(`Could not geocode activity '${placeName}' near location '${location}'.`);
      }
      return { address: '', rating: null, photos: [], priceLevel: null, name: placeName };
    }

    // For each location, fetch details for each itinerary item
    type ItineraryDetail = {
      address: string;
      rating: number | null;
      photos: string[];
      priceLevel: number | null;
      name: string;
    };
    type LocationType = {
      name: string;
      description: string;
      itinerary: string[];
      estimatedCost: number;
    };
    const enhancedLocations = await Promise.all(locations.map(async (loc: LocationType) => {
      const itineraryDetails: ItineraryDetail[] = await Promise.all(
        (loc.itinerary || []).map(async (item: string) => {
          const details = await fetchPlaceDetails(item, loc.name);
          return details as ItineraryDetail;
        })
      );
      // If all itinerary details failed geocoding, fallback to just the location name
      const allFailed = itineraryDetails.every((d: ItineraryDetail) => !d.address);
      if (allFailed) {
        console.warn(`All activities for location '${loc.name}' failed geocoding. Falling back to location name only.`);
        itineraryDetails.push({ address: loc.name, rating: null, photos: [], priceLevel: null, name: loc.name });
      }
      return {
        ...loc,
        itineraryDetails,
      };
    }));

    // Store the generated itineraries in the database for future use
    try {
      // Get the current user's member ID
      const { data: currentMember } = await supabase
        .from('members')
        .select('id')
        .eq('clerk_user_id', userId)
        .eq('group_id', groupId)
        .single();

      const { error: storeError } = await supabase
        .from('itineraries')
        .insert({
          group_id: groupId,
          locations: enhancedLocations,
          created_by: currentMember?.id || null
        });

      if (storeError) {
        console.error('Error storing itineraries:', storeError);
        // Don't fail the request if storing fails
      } else {
        console.log('Successfully stored itineraries for group:', groupId);
      }
    } catch (storeError) {
      console.error('Error storing itineraries:', storeError);
      // Don't fail the request if storing fails
    }

    return NextResponse.json({ success: true, locations: enhancedLocations });
  } catch (error) {
    console.error('Error finding optimal locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find optimal locations' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';