import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { isGeoapifyHealthy } from '@/lib/geoapify';


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
    const shouldGenerate = url.searchParams.get('generate') === 'true';

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // First, check if itineraries already exist for this group
    console.log('Checking for existing itineraries for group:', groupId);

    // FETCH LATEST SNAPSHOT
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('ItinerarySnapshot')
      .select('*')
      .eq('groupId', groupId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') { // Ignore "no rows found" error
      console.error('Error fetching existing snapshot:', snapshotError);
    }

    // If snapshot exists and not forcing generation, return it
    if (latestSnapshot && !shouldGenerate) {
      console.log('Found existing snapshot:', latestSnapshot.id);

      // Fetch items for this snapshot
      const { data: items, error: itemsError } = await supabase
        .from('ItineraryItem')
        .select('*')
        .eq('snapshotId', latestSnapshot.id)
        .order('position', { ascending: true });

      if (itemsError) {
        console.error('Error fetching itinerary items:', itemsError);
        // If we have a snapshot but no items, we might want to regenerate, or just return empty
      } else if (items && items.length > 0) {
        // Reconstruct locations structure from items + metadata
        const reconstructedLocations = items.map(item => ({
          ...item.metadata, // Spread stored metadata back
          name: item.name, // Ensure top-level fields override
          description: item.description,
          itemId: item.id, // CRITICAL: Pass itemId to frontend
          snapshotId: latestSnapshot.id
        }));

        return NextResponse.json({
          success: true,
          locations: reconstructedLocations,
          snapshotId: latestSnapshot.id,
          cached: true,
          createdAt: latestSnapshot.created_at
        });
      }
    }

    // If not generating new ones (admin didn't click), just return empty
    if (!shouldGenerate && !latestSnapshot) {
      console.log('No cached itineraries and generation not requested for group:', groupId);
      return NextResponse.json({
        success: true,
        locations: [],
        cached: false,
        message: 'No itineraries generated yet. Admin needs to generate them.'
      });
    }

    console.log('Generating new itineraries for group:', groupId);

    // Get all members of the group from Supabase
    const { data: members, error } = await supabase
      .from('Member')
      .select('*')
      .eq('groupId', groupId);

    if (error || !members || members.length === 0) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    // Import Engine Logic dynamically to avoid circular deps if any
    const { computeHubs, generateItineraries } = await import('@/lib/engine');

    // Prepare Member Inputs
    const engineMembers = members.map(m => ({
      location: m.location,
      budget: m.budget,
      moodTags: m.moodTags ? m.moodTags.split(',').map((t: string) => t.trim()) : []
    }));

    // 1. Compute Hubs
    console.log('Computing hubs for members:', engineMembers.length);
    const hubs = await computeHubs(engineMembers);

    // 2. Generate Itineraries
    console.log('Generating smart itineraries...');
    const generatedItineraries = await generateItineraries(engineMembers, hubs);

    const usedFallback = generatedItineraries.length === 0;

    // 3. AI Narratives (in parallel)
    const { groq } = await import('@/lib/groq');

    // Generate narrative for each itinerary
    const finalItineraries = await Promise.all(generatedItineraries.map(async (itinerary) => {
      let narrative = `An ${itinerary.archetype} experience.`;
      try {
        const prompt = `Write a single, exciting sentence (max 15 words) explaining why this itinerary is great for a group interested in ${engineMembers[0].moodTags.join(', ')}. Itinerary: ${itinerary.archetype} in ${itinerary.name}.`;
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          max_tokens: 30
        });
        narrative = completion.choices[0]?.message?.content?.trim() || narrative;
        // Strip quotes if present
        narrative = narrative.replace(/^["']|["']$/g, '');
      } catch (e) {
        console.warn('Narrative generation failed, using fallback');
      }
      return { ...itinerary, narrative };
    }));


    // Store in DB
    let snapshotId: string | undefined;
    const itemIdMap = new Map<number, string>();

    try {
      // Get the current user's member ID
      const { data: currentMember } = await supabase
        .from('Member')
        .select('id')
        .eq('clerkUserId', userId)
        .eq('groupId', groupId)
        .single();

      // Create Snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from('ItinerarySnapshot')
        .insert({
          groupId: groupId,
          source: 'smart-engine',
          metadata: {
            created_by_member_id: currentMember?.id,
            total_itineraries: generatedItineraries.length
          }
        })
        .select()
        .single();

      if (snapshotError) {
        console.error('Error creating snapshot:', snapshotError);
      } else if (snapshot) {
        snapshotId = snapshot.id;

        // Create Items
        // We need to flatten the "itineraries" into a list of displayable options
        // The frontend expects a list of "locations" (which are actually itineraries/options)
        const itemsToInsert = finalItineraries.map((itinerary, index) => ({
          snapshotId: snapshot.id,
          name: itinerary.name, // e.g., "Central Midpoint Food Crawl"
          description: itinerary.narrative, // Use AI narrative
          address: itinerary.items[0]?.address || 'Multiple Locations', // Use first item as anchor?
          // We don't have a single "rating" for the whole itinerary, maybe average?
          rating: 4.5,
          priceLevel: itinerary.items[0]?.priceLevel || 2,
          position: index,
          metadata: itinerary // Store the full structure
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('ItineraryItem')
          .insert(itemsToInsert)
          .select();

        if (itemsError) {
          console.error('Error creating itinerary items:', itemsError);
        } else if (insertedItems) {
          // Map position -> ID for the response
          insertedItems.forEach(item => {
            itemIdMap.set(item.position, item.id);
          });
        }
      }
    } catch (e) {
      console.error('Error saving snapshot:', e);
    }

    // Map to frontend "Location" structure
    const finalLocations = finalItineraries.map((itinerary, index) => ({
      name: itinerary.name,
      description: itinerary.narrative,
      itemId: itemIdMap.get(index) || 'temp-id', // Use real DB ID if available
      // Polyfill for legacy frontend compatibility
      itinerary: itinerary.items.map(i => i.name),
      itineraryDetails: itinerary.items,
      estimatedCost: itinerary.totalCostEstimate
    }));

    return NextResponse.json({
      success: true,
      locations: finalLocations,
      snapshotId,
      usedFallback,
      message: 'Generated smart itineraries'
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