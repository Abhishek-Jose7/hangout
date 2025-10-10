import { NextRequest, NextResponse } from 'next/server';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5000';

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Search for romantic date places
    const placeTypes = [
      'restaurant',
      'cafe',
      'spa',
      'movie_theater',
      'art_gallery',
      'museum',
      'park',
      'beach',
      'bowling_alley',
      'amusement_park'
    ];

    const allPlaces = [];

    for (const placeType of placeTypes) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${placeType}&key=${MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          // Filter and enhance places for date suitability
          const datePlaces = data.results
            .filter((place: { name?: string; types?: string[] }) => {
              const name = place.name?.toLowerCase() || '';
              const types = place.types || [];
              
              // Filter for romantic/date-friendly places
              const romanticKeywords = ['romantic', 'couple', 'date', 'fine dining', 'wine', 'art', 'spa', 'cafe', 'restaurant'];
              const hasRomanticKeyword = romanticKeywords.some(keyword => name.includes(keyword));
              const hasDateType = types.some((type: string) => ['restaurant', 'cafe', 'spa', 'art_gallery', 'movie_theater'].includes(type));
              
              return hasRomanticKeyword || hasDateType;
            })
            .slice(0, 3) // Limit to 3 places per type
            .map((place: { place_id: string; name: string; vicinity: string; rating?: number; price_level?: number; types: string[]; geometry: { location: { lat: number; lng: number } }; photos?: unknown[]; opening_hours?: unknown }) => ({
              id: place.place_id,
              name: place.name,
              address: place.vicinity,
              rating: place.rating,
              priceLevel: place.price_level,
              types: place.types,
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              },
              photos: place.photos ? place.photos.slice(0, 3) : [],
              openingHours: place.opening_hours,
              dateType: placeType,
              estimatedCost: place.price_level ? (place.price_level * 300 + 200) : 500
            }));

          allPlaces.push(...datePlaces);
        }
      } catch (error) {
        console.error(`Error fetching ${placeType} places:`, error);
      }
    }

    // Remove duplicates and sort by rating
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.id === place.id)
    ).sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return NextResponse.json({
      success: true,
      places: uniquePlaces.slice(0, 10), // Return top 10 places
      total: uniquePlaces.length
    });

  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
  }
}
