import { NextRequest, NextResponse } from 'next/server';

// Google Maps API key
const MAPS_API_KEY = "AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const location = url.searchParams.get('location');

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location parameter is required' }, { status: 400 });
    }

    if (!MAPS_API_KEY) {
      return NextResponse.json({ success: false, error: 'MAPS_API_KEY not set' }, { status: 500 });
    }

    // Use Google Geocoding API to get coordinates
    const encodedLocation = encodeURIComponent(location);
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${MAPS_API_KEY}`;

    const response = await fetch(geocodingUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Could not geocode location: ${location}`,
        details: data.status
      }, { status: 404 });
    }

    const result = data.results[0];
    const coordinates = result.geometry.location;

    return NextResponse.json({
      success: true,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      formattedAddress: result.formatted_address,
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
