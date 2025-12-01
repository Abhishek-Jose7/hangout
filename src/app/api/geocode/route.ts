import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geoapify';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const location = url.searchParams.get('location');

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location parameter is required' }, { status: 400 });
    }

    // Use Geoapify for geocoding
    const coordinates = await geocodeLocation(location);
    
    if (!coordinates) {
      return NextResponse.json({
        success: false,
        error: `Could not geocode location: ${location}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      formattedAddress: location,
      locationName: location
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
