import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { findOptimalLocations } from '@/lib/gemini';

// Check if Supabase client is available
if (!supabase) {
  throw new Error('Supabase client not configured');
}

export async function GET(request: NextRequest) {
  try {
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

    // Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

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
    const formattedMembers = members.map((member: { name: string; location: string; budget: number; mood_tags: string }) => ({
      name: member.name,
      location: member.location,
      budget: member.budget,
      moodTags: member.mood_tags && member.mood_tags.length > 0
        ? member.mood_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : []
    }));
    
    // Get optimal locations using Gemini API
    const locationsResult = await findOptimalLocations(formattedMembers);
    const locations = locationsResult.locations || [];

    // Google Maps API key
    const MAPS_API_KEY = "AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU";
    if (!MAPS_API_KEY) {
      return NextResponse.json({ success: false, error: 'MAPS_API_KEY not set' }, { status: 500 });
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