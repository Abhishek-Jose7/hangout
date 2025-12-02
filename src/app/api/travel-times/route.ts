import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// GET: Calculate travel times for all members to a destination
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
    const destinationLat = url.searchParams.get('lat');
    const destinationLng = url.searchParams.get('lng');
    const destinationName = url.searchParams.get('name') || 'Destination';

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Fetch all members with their locations
    const { data: members, error: memberError } = await supabase
      .from('Member')
      .select('id, name, location, clerkUserId')
      .eq('groupId', groupId);

    if (memberError) {
      console.error('Error fetching members:', memberError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    if (!members?.length) {
      return NextResponse.json({
        success: true,
        travelTimes: [],
        summary: null
      });
    }

    // If destination coordinates are provided, calculate travel times
    const travelTimes = await Promise.all(
      members.map(async (member) => {
        // First, geocode the member's location
        let memberCoords = null;
        
        try {
          const geocodeResponse = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(member.location)}&apiKey=${process.env.GEOAPIFY_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.features?.[0]?.geometry?.coordinates) {
            memberCoords = {
              lng: geocodeData.features[0].geometry.coordinates[0],
              lat: geocodeData.features[0].geometry.coordinates[1]
            };
          }
        } catch (err) {
          console.error('Geocoding error for member:', member.name, err);
        }

        const travelTime = {
          memberId: member.id,
          memberName: member.name,
          memberLocation: member.location,
          destination: destinationName,
          coordinates: memberCoords,
          drivingTime: null as number | null,
          drivingDistance: null as number | null,
          transitTime: null as number | null,
          walkingTime: null as number | null,
          error: null as string | null
        };

        // If we have both origin and destination coordinates, calculate routes
        if (memberCoords && destinationLat && destinationLng) {
          try {
            // Calculate driving route
            const routeResponse = await fetch(
              `https://api.geoapify.com/v1/routing?waypoints=${memberCoords.lat},${memberCoords.lng}|${destinationLat},${destinationLng}&mode=drive&apiKey=${process.env.GEOAPIFY_API_KEY}`
            );
            const routeData = await routeResponse.json();
            
            if (routeData.features?.[0]?.properties) {
              const props = routeData.features[0].properties;
              travelTime.drivingTime = Math.round(props.time / 60); // Convert to minutes
              travelTime.drivingDistance = Math.round(props.distance / 1000 * 10) / 10; // Convert to km
            }

            // Calculate transit time
            const transitResponse = await fetch(
              `https://api.geoapify.com/v1/routing?waypoints=${memberCoords.lat},${memberCoords.lng}|${destinationLat},${destinationLng}&mode=transit&apiKey=${process.env.GEOAPIFY_API_KEY}`
            );
            const transitData = await transitResponse.json();
            
            if (transitData.features?.[0]?.properties) {
              travelTime.transitTime = Math.round(transitData.features[0].properties.time / 60);
            }

            // Calculate walking time
            const walkResponse = await fetch(
              `https://api.geoapify.com/v1/routing?waypoints=${memberCoords.lat},${memberCoords.lng}|${destinationLat},${destinationLng}&mode=walk&apiKey=${process.env.GEOAPIFY_API_KEY}`
            );
            const walkData = await walkResponse.json();
            
            if (walkData.features?.[0]?.properties) {
              travelTime.walkingTime = Math.round(walkData.features[0].properties.time / 60);
            }
          } catch (err) {
            console.error('Route calculation error:', err);
            travelTime.error = 'Failed to calculate route';
          }
        } else if (!memberCoords) {
          travelTime.error = 'Could not geocode member location';
        } else {
          travelTime.error = 'No destination coordinates provided';
        }

        return travelTime;
      })
    );

    // Calculate summary statistics
    const validTimes = travelTimes.filter(t => t.drivingTime !== null);
    const summary = validTimes.length > 0 ? {
      destination: destinationName,
      averageTravelTime: Math.round(
        validTimes.reduce((sum, t) => sum + (t.drivingTime || 0), 0) / validTimes.length
      ),
      maxTravelTime: Math.max(...validTimes.map(t => t.drivingTime || 0)),
      minTravelTime: Math.min(...validTimes.map(t => t.drivingTime || 0)),
      totalDistance: validTimes.reduce((sum, t) => sum + (t.drivingDistance || 0), 0),
      membersWithData: validTimes.length,
      membersWithoutData: travelTimes.length - validTimes.length
    } : null;

    return NextResponse.json({
      success: true,
      travelTimes,
      summary
    });
  } catch (error) {
    console.error('Error calculating travel times:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate travel times' },
      { status: 500 }
    );
  }
}

// POST: Get travel times for multiple destinations at once
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
    const { groupId, destinations } = body;

    if (!groupId || !destinations?.length) {
      return NextResponse.json(
        { success: false, error: 'Group ID and destinations are required' },
        { status: 400 }
      );
    }

    // Fetch all members
    const { data: members, error: memberError } = await supabase
      .from('Member')
      .select('id, name, location')
      .eq('groupId', groupId);

    if (memberError || !members?.length) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    // Geocode member locations once
    const memberCoords: Record<string, { lat: number; lng: number } | null> = {};
    
    await Promise.all(
      members.map(async (member) => {
        try {
          const geocodeResponse = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(member.location)}&apiKey=${process.env.GEOAPIFY_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.features?.[0]?.geometry?.coordinates) {
            memberCoords[member.id] = {
              lng: geocodeData.features[0].geometry.coordinates[0],
              lat: geocodeData.features[0].geometry.coordinates[1]
            };
          } else {
            memberCoords[member.id] = null;
          }
        } catch {
          memberCoords[member.id] = null;
        }
      })
    );

    // Calculate travel times for each destination
    const results = await Promise.all(
      destinations.map(async (dest: { placeId: string; name: string; lat: number; lng: number }) => {
        const memberTimes = await Promise.all(
          members.map(async (member) => {
            const coords = memberCoords[member.id];
            if (!coords) {
              return {
                memberId: member.id,
                memberName: member.name,
                drivingTime: null,
                transitTime: null,
                error: 'Location not found'
              };
            }

            try {
              const routeResponse = await fetch(
                `https://api.geoapify.com/v1/routing?waypoints=${coords.lat},${coords.lng}|${dest.lat},${dest.lng}&mode=drive&apiKey=${process.env.GEOAPIFY_API_KEY}`
              );
              const routeData = await routeResponse.json();

              return {
                memberId: member.id,
                memberName: member.name,
                drivingTime: routeData.features?.[0]?.properties?.time 
                  ? Math.round(routeData.features[0].properties.time / 60) 
                  : null,
                transitTime: null,
                error: null
              };
            } catch {
              return {
                memberId: member.id,
                memberName: member.name,
                drivingTime: null,
                transitTime: null,
                error: 'Route calculation failed'
              };
            }
          })
        );

        const validTimes = memberTimes.filter(t => t.drivingTime !== null);
        
        return {
          placeId: dest.placeId,
          placeName: dest.name,
          memberTravelTimes: memberTimes,
          averageTravelTime: validTimes.length > 0
            ? Math.round(validTimes.reduce((sum, t) => sum + (t.drivingTime || 0), 0) / validTimes.length)
            : null,
          maxTravelTime: validTimes.length > 0
            ? Math.max(...validTimes.map(t => t.drivingTime || 0))
            : null,
          minTravelTime: validTimes.length > 0
            ? Math.min(...validTimes.map(t => t.drivingTime || 0))
            : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error calculating travel times:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate travel times' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
