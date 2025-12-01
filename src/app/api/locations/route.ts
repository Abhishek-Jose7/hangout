import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { findOptimalLocations } from '@/lib/groq';
import { isGeoapifyHealthy, searchPlace } from '@/lib/geoapify';

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
      .from('Itinerary')
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
      .from('Member')
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

    // Helper function to generate fallback locations
    function generateFallbackLocations(members: Array<{ name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }>) {
      const avgBudget = members.reduce((sum, m) => sum + m.budget, 0) / members.length;

      // Popular, proven locations in India with verified activities
      const fallbackOptions = [
        {
          name: "Connaught Place, Delhi",
          description: "Central Delhi's iconic shopping and dining district with excellent metro connectivity",
          itinerary: [
            "Coffee at Cafe Coffee Day",
            "Shopping at Central Market",
            "Lunch at McDonald's Connaught Place",
            "Visit Palika Bazaar"
          ],
          estimatedCost: Math.min(avgBudget, 800)
        },
        {
          name: "Phoenix MarketCity, Mumbai",
          description: "Modern mall with diverse dining, shopping, and entertainment options",
          itinerary: [
            "Breakfast at Starbucks Coffee",
            "Movie at PVR Cinemas Phoenix",
            "Lunch at KFC Phoenix Mall",
            "Games at Timezone Arcade"
          ],
          estimatedCost: Math.min(avgBudget, 1000)
        },
        {
          name: "Indiranagar, Bangalore",
          description: "Trendy neighborhood with cafes, restaurants, and shopping on 100 Feet Road",
          itinerary: [
            "Breakfast at Third Wave Coffee",
            "Shopping at Chinmaya Mission Road",
            "Lunch at Pizza Hut Indiranagar",
            "Coffee at Cafe Coffee Day"
          ],
          estimatedCost: Math.min(avgBudget, 900)
        }
      ];

      // Return 3 locations sorted by budget match
      return fallbackOptions
        .sort((a, b) => Math.abs(a.estimatedCost - avgBudget) - Math.abs(b.estimatedCost - avgBudget))
        .slice(0, 3);
    }

    // Get optimal locations using Gemini API with fallback
    let locations = [];
    let usedFallback = false;

    try {
      // Pass isDatePlanner: false for regular group hangouts
      const locationsResult = await findOptimalLocations(formattedMembers, false);
      locations = locationsResult.locations || [];
    } catch (geminiError: unknown) {
      console.error('Gemini API error:', geminiError);

      // Use fallback locations instead of returning error
      console.log('Using fallback locations due to API error');
      locations = generateFallbackLocations(formattedMembers);
      usedFallback = true;
    }

    // Check if Geoapify API is working
    const geoapifyHealthy = await isGeoapifyHealthy();
    console.log('Geoapify API healthy:', geoapifyHealthy);

    // Helper function to get coordinates for a location using Google Geocoding API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
      try {
        const encodedLocation = encodeURIComponent(locationName);
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedLocation}&apiKey=7995485a15804ab1ac4080a06726595f&limit=1`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const coordinates = data.features[0].geometry?.coordinates;
          if (coordinates && coordinates.length >= 2) {
            return { lat: coordinates[1], lng: coordinates[0] };
          }
        }
        return null;
      } catch (error) {
        console.error('Error geocoding location:', error);
        return null;
      }
    }

    // Helper function to calculate distance between two coordinates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    }

    // Helper to fetch place details from Geoapify API with enhanced validation
    async function fetchPlaceDetails(placeName: string, location: string): Promise<ItineraryDetail> {
      // If Geoapify API is not healthy, return basic details without API calls
      if (!geoapifyHealthy) {
        console.log(`Geoapify API not available, returning basic details for '${placeName}'`);
        return {
          address: `${placeName}, ${location}`,
          rating: null,
          photos: [],
          priceLevel: null,
          name: placeName,
          placeId: '',
          mapsLink: `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName + ' ' + location)}`,
          reviews: [],
          userRatingsTotal: 0
        };
      }

      try {
        // Clean and validate the place name
        const cleanPlaceName = placeName.trim();
        if (!cleanPlaceName || cleanPlaceName.length < 3) {
          console.warn(`Invalid place name: '${placeName}'`);
          return { address: '', rating: null, photos: [], priceLevel: null, name: placeName, placeId: '', mapsLink: '', reviews: [], userRatingsTotal: 0 };
        }

        // Use Geoapify to search for the place
        const placeDetails = await searchPlace(placeName, location);
        return {
          address: placeDetails.address,
          rating: placeDetails.rating,
          photos: placeDetails.photos,
          priceLevel: placeDetails.priceLevel,
          name: placeDetails.name,
          placeId: placeDetails.placeId,
          mapsLink: placeDetails.mapsLink,
          reviews: placeDetails.reviews,
          userRatingsTotal: placeDetails.userRatingsTotal
        };
      } catch (error) {
        console.error(`Error in fetchPlaceDetails for '${placeName}':`, error);
        return { address: '', rating: null, photos: [], priceLevel: null, name: placeName, placeId: '', mapsLink: '', reviews: [], userRatingsTotal: 0 };
      }
    }

    // Calculate relevance score between search query and result
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function calculateRelevance(query: string, resultName: string, types: string[]): number {
      const queryLower = query.toLowerCase();
      const resultLower = resultName.toLowerCase();

      // Exact match
      if (queryLower === resultLower) return 1.0;

      // Contains match
      if (resultLower.includes(queryLower) || queryLower.includes(resultLower)) return 0.8;

      // Word overlap
      const queryWords = queryLower.split(/\s+/);
      const resultWords = resultLower.split(/\s+/);
      const overlap = queryWords.filter(word => resultWords.some(rw => rw.includes(word) || word.includes(rw)));
      const overlapScore = overlap.length / Math.max(queryWords.length, resultWords.length);

      // Bonus for having relevant types
      const relevantTypes = ['restaurant', 'cafe', 'store', 'point_of_interest', 'establishment'];
      const hasRelevantType = types.some(t => relevantTypes.includes(t));

      return overlapScore * (hasRelevantType ? 1.0 : 0.7);
    }

    // For each location, fetch details for each itinerary item
    type ItineraryDetail = {
      address: string;
      rating: number | null;
      photos: string[];
      priceLevel: number | null;
      name: string;
      placeId: string;
      mapsLink: string;
      reviews: Array<{
        author_name: string;
        rating: number;
        text: string;
        time: number;
      }>;
      userRatingsTotal: number;
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

      // Quality check: count how many itinerary items have valid data
      const validItems = itineraryDetails.filter(d => d.address && d.placeId);
      const validityRatio = validItems.length / Math.max(itineraryDetails.length, 1);

      console.log(`Location '${loc.name}': ${validItems.length}/${itineraryDetails.length} items have valid Maps data (${(validityRatio * 100).toFixed(1)}%)`);

      // If less than 50% of items are valid, this location is low quality
      if (validityRatio < 0.5 && itineraryDetails.length > 0) {
        console.warn(`Low quality location detected: '${loc.name}' (only ${(validityRatio * 100).toFixed(1)}% valid items)`);
      }

      // Filter out any itinerary items that match the location name (duplicates)
      const filteredItineraryDetails = itineraryDetails.filter(d => {
        const itemNameLower = d.name.toLowerCase();
        const locationNameLower = loc.name.toLowerCase();
        // Remove if the item name contains the exact location name
        return !itemNameLower.includes(locationNameLower) && !locationNameLower.includes(itemNameLower);
      });

      // If we filtered everything out or all failed geocoding, don't add a fallback
      const allFailed = filteredItineraryDetails.length === 0 || filteredItineraryDetails.every((d: ItineraryDetail) => !d.address);
      if (allFailed) {
        console.warn(`All activities for location '${loc.name}' failed geocoding or were duplicates. Skipping fallback.`);
        // Don't add the location name itself - just use what we have
      }

      return {
        ...loc,
        itineraryDetails: filteredItineraryDetails,
        qualityScore: validityRatio, // Add quality score for potential filtering
      };
    }));

    // Filter out locations with very poor quality (less than 10% valid items)
    // But be lenient - we want to show 3 locations minimum
    const qualityLocations = enhancedLocations.filter(loc => {
      const score = (loc as { qualityScore?: number }).qualityScore || 0;
      const hasItinerary = loc.itineraryDetails && loc.itineraryDetails.length > 0;

      // Only filter out completely broken locations (0% valid AND no itinerary)
      if (score === 0 && !hasItinerary) {
        console.warn(`Filtering out completely empty location: '${loc.name}'`);
        return false;
      }
      return true;
    });

    // Always keep at least 3 locations, preferably all that were generated
    const finalLocations = qualityLocations.length >= 3 ? qualityLocations : enhancedLocations.slice(0, Math.max(3, qualityLocations.length));

    console.log(`Final locations count: ${finalLocations.length} (filtered ${enhancedLocations.length - finalLocations.length})`);

    // Store the generated itineraries in the database for future use
    try {
      // Get the current user's member ID
      const { data: currentMember } = await supabase
        .from('Member')
        .select('id')
        .eq('clerk_user_id', userId)
        .eq('group_id', groupId)
        .single();

      const { error: storeError } = await supabase
        .from('Itinerary')
        .insert({
          group_id: groupId,
          locations: finalLocations,
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

    return NextResponse.json({
      success: true,
      locations: finalLocations,
      usedFallback: usedFallback,
      message: usedFallback ? 'Using curated locations due to high demand. These are proven, popular meetup spots!' : undefined
    });
  } catch (error) {
    console.error('Error finding optimal locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find optimal locations' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';