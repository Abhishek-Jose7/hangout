import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOptimalLocations } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }
    
    // Get all members of the group
    const members = await prisma.member.findMany({
      where: { groupId }
    });
    
    if (members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No members found in this group' },
        { status: 404 }
      );
    }
    
    // Format members for the Gemini API
    const formattedMembers = members.map(member => ({
  name: member.name,
  location: member.location,
  budget: member.budget,
  moodTags: member.moodTags ?? ''
    }));
    
    // Get optimal locations using Gemini API
    const locationsResult = await findOptimalLocations(formattedMembers);
    const locations = locationsResult.locations || [];

    // Google Maps API key
    const MAPS_API_KEY = process.env.MAPS_API_KEY || 'AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU';

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
          photos: place.photos ? place.photos.slice(0, 2).map((p: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${MAPS_API_KEY}`) : [],
          priceLevel: place.price_level || null,
          name: place.name || placeName
        };
      } else {
        console.warn(`Could not geocode activity '${placeName}' near location '${location}'.`);
      }
      return { address: '', rating: null, photos: [], priceLevel: null, name: placeName };
    }

    // For each location, fetch details for each itinerary item
    const enhancedLocations = await Promise.all(locations.map(async (loc: any) => {
      const itineraryDetails = await Promise.all(
        (loc.itinerary || []).map(async (item: string) => {
          const details = await fetchPlaceDetails(item, loc.name);
          return details;
        })
      );
      // If all itinerary details failed geocoding, fallback to just the location name
      const allFailed = itineraryDetails.every(d => !d.address);
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