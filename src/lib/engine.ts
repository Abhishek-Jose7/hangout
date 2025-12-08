import {
    Hub,
    Candidate,
    EnginePreferences,
    ItineraryArchetype,
    ItineraryItem,
    GeneratedItinerary,
    MoodConfig
} from '@/types/engine';
import { geocodeLocation, searchPlacesNearby, reverseGeocode } from './geoapify';

// ============================================================================
// 1. HUB COMPUTATION ENGINE
// ============================================================================

export async function computeHubs(members: Array<{ location: string }>): Promise<Hub[]> {
    // 1. Geocode all members
    const coordinates = await Promise.all(
        members.map(async (m) => {
            const coords = await geocodeLocation(m.location);
            return coords ? { ...coords, location: m.location } : null;
        })
    );

    const validCoords = coordinates.filter((c): c is { lat: number; lng: number; location: string } => c !== null);

    console.log('Engine: Valid Member Coords:', validCoords);

    if (validCoords.length === 0) return [];

    const hubs: Hub[] = [];

    // Calculate centroid (Geometric Midpoint)
    const totalLat = validCoords.reduce((sum, c) => sum + c.lat, 0);
    const totalLng = validCoords.reduce((sum, c) => sum + c.lng, 0);
    const centLat = totalLat / validCoords.length;
    const centLng = totalLng / validCoords.length;

    // Check spread (Max distance from centroid to any member)
    const maxDist = validCoords.reduce((max, c) => {
        const d = Math.sqrt(Math.pow(c.lat - centLat, 2) + Math.pow(c.lng - centLng, 2));
        return Math.max(max, d);
    }, 0);

    const isSpreadOut = maxDist > 0.05; // Approx 5-6km radius, so ~10km max separation

    // 1. Always add the Fair Midpoint
    const midName = await reverseGeocode(centLat, centLng);
    hubs.push({
        id: 'hub-midpoint',
        name: midName ? `Fair Midpoint (${midName})` : 'Fair Midpoint',
        lat: centLat,
        lng: centLng,
        type: 'centroid',
        score: 1.0
    });

    // 2. Only add Member Hugs if NOT spread out (Local clustering)
    if (!isSpreadOut) {
        const uniqueLocs = validCoords.filter((v, i, a) => a.findIndex(t => t.location === v.location) === i);
        uniqueLocs.slice(0, 3).forEach((loc, i) => {
            hubs.push({
                id: `hub-member-${i}`,
                name: `Near ${loc.location}`,
                lat: loc.lat,
                lng: loc.lng,
                type: 'poi',
                score: 0.8
            });
        });
    } else {
        console.log('Engine: Group is spread out, skipping member-biased hubs.');
    }

    console.log('Engine: Generated Hubs:', hubs.map(h => h.name));
    return hubs;
}

// ============================================================================
// 2. SCORING ENGINE
// ============================================================================

export function scoreCandidate(
    candidate: Candidate,
    hub: Hub,
    prefs: EnginePreferences
): number {
    let score = 0;

    // A. Distance Score (30%)
    // Inverse distance from Hub. 
    // Simple Haversine approximation or Euclidean for speed
    const dist = Math.sqrt(Math.pow(candidate.lat - hub.lat, 2) + Math.pow(candidate.lng - hub.lng, 2));
    // Rough conversion: 0.1 degrees ~= 11km. 
    // Let's say optimal is within 0.05 (5km).
    const distanceScore = Math.max(0, 1 - (dist / 0.1));
    score += distanceScore * 0.3;

    // B. Tag Match Score (40%)
    // How many mood categories does it match?
    // (In real impl, we'd check strict category overlap)
    score += 0.4; // Default high for now as we pre-filter by category

    // C. Rating Score (20%)
    // Normalize 3.5-5.0 range
    if (candidate.rating) {
        const normRating = Math.max(0, (candidate.rating - 3.5) / 1.5);
        score += normRating * 0.2;
    }

    // D. Budget Fit (10%)
    if (candidate.priceLevel) {
        const diff = Math.abs(candidate.priceLevel - prefs.budgetLevel);
        const budgetScore = Math.max(0, 1 - (diff * 0.25));
        score += budgetScore * 0.1;
    }

    // Store components for debug
    candidate.scores = {
        total: score,
        distance: distanceScore,
        tagMatch: 0.4,
        rating: candidate.rating ? (candidate.rating - 3.5) / 1.5 : 0,
        budget: candidate.priceLevel ? Math.max(0, 1 - (Math.abs(candidate.priceLevel - prefs.budgetLevel) * 0.25)) : 0
    };

    return score;
}

// ============================================================================
// 3. ARCHETYPE BUILDER
// ============================================================================

const CATEGORY_MAPPINGS: Record<string, string[]> = {
    'foodie': ['catering.restaurant', 'catering.bar', 'catering.street_food'],
    'active': ['entertainment', 'leisure.park', 'entertainment.bowling_alley'],
    'relaxed': ['catering.cafe', 'leisure.park', 'entertainment.cinema'],
    'shopping': ['commercial.shopping_mall', 'catering.cafe']
};

export async function generateItineraries(
    members: Array<{ location: string; budget: number; moodTags: string[] }>,
    hubs: Hub[]
): Promise<GeneratedItinerary[]> {

    const itineraries: GeneratedItinerary[] = [];
    const avgBudget = members.reduce((sum, m) => sum + m.budget, 0) / members.length;
    // Budget levels: 1 (Cheap) to 4 (Expensive)
    const budgetLevel = Math.min(4, Math.max(1, Math.ceil(avgBudget / 500))) as 1 | 2 | 3 | 4;

    const prefs: EnginePreferences = {
        budgetLevel,
        maxTravelTimeMinutes: 45,
        moodTags: members.flatMap(m => m.moodTags)
    };

    // Iterate Hubs
    for (const hub of hubs) {
        // Wide search for centers
        const radius = hub.id === 'hub-midpoint' ? 10000 : 5000;

        const rawCandidates = await searchPlacesNearby(
            hub.lat,
            hub.lng,
            ['catering.restaurant', 'catering.cafe', 'entertainment', 'leisure.park', 'commercial.shopping_mall'],
            radius,
            60 // Fetch more to filter down
        );

        // Score
        const scored = rawCandidates.map(c => {
            scoreCandidate(c, hub, prefs);
            return c;
        }).filter(c => (c.scores?.total || 0) > 0.4);

        if (scored.length < 2) continue;

        // --- Generate Experience-Based Itineraries ---

        // 1. "Best Middle Choice" (Balanced / High Score)
        const bestMix = scored.sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0)).slice(0, 3);
        if (bestMix.length >= 2) {
            itineraries.push({
                id: `gen-${hub.id}-best-${Date.now()}`,
                hubId: hub.id,
                archetype: 'balanced',
                name: `Best Middle Choice (${hub.name.split('(')[1]?.replace(')', '') || 'Central'})`, // e.g. "Best Middle Choice (Ghatkopar)"
                items: bestMix.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 90, reason: 'Top rated match' })),
                totalCostEstimate: avgBudget,
                totalTravelMinutes: 45,
                diversityScore: 0.95
            });
        }

        // 2. "Premium Hangout Experience" (High Price / Rating)
        const premium = scored
            .filter(c => (c.priceLevel || 0) >= 3 || (c.rating || 0) >= 4.5)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

        if (premium.length >= 2) {
            itineraries.push({
                id: `gen-${hub.id}-premium-${Date.now()}`,
                hubId: hub.id,
                archetype: 'premium',
                name: `Premium Hangout Experience`,
                items: premium.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 120, reason: 'Premium spot' })),
                totalCostEstimate: avgBudget * 1.5,
                totalTravelMinutes: 45,
                diversityScore: 0.9
            });
        }

        // 3. "Wallet-Friendly / Street Food" (Low Price)
        const budgetSpots = scored
            .filter(c => (c.priceLevel || 0) <= 2)
            .sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))
            .slice(0, 3);

        if (budgetSpots.length >= 2) {
            itineraries.push({
                id: `gen-${hub.id}-budget-${Date.now()}`,
                hubId: hub.id,
                archetype: 'budget',
                name: `Pocket-Friendly Gems`,
                items: budgetSpots.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 60, reason: 'Great value' })),
                totalCostEstimate: avgBudget * 0.6,
                totalTravelMinutes: 45,
                diversityScore: 0.85
            });
        }

        // 4. "Activity-Focused" (Entertainment)
        const active = scored
            .filter(c => c.categories.some(cat => cat.includes('entertainment') || cat.includes('leisure')))
            .sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))
            .slice(0, 3);

        if (active.length >= 2) {
            itineraries.push({
                id: `gen-${hub.id}-active-${Date.now()}`,
                hubId: hub.id,
                archetype: 'adventure',
                name: `Activity & Fun`,
                items: active.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 120, reason: 'Fun activity' })),
                totalCostEstimate: avgBudget,
                totalTravelMinutes: 45,
                diversityScore: 0.9
            });
        }

        // 5. "Relaxed / Cafe Vibe" (Specific Cafe check)
        const cafes = scored
            .filter(c => c.categories.some(cat => cat.includes('cafe')))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

        if (cafes.length >= 2) {
            itineraries.push({
                id: `gen-${hub.id}-relaxed-${Date.now()}`,
                hubId: hub.id,
                archetype: 'relaxed',
                name: `Chill Cafe Hopping`,
                items: cafes.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 90, reason: 'Cozy vibes' })),
                totalCostEstimate: avgBudget * 0.7,
                totalTravelMinutes: 30,
                diversityScore: 0.8
            });
        }

        // 6. "City Explorer" (General fallback for high rated spots that might not fit strict buckets)
        // Taking a mix of top rated spots that might be restaurants or anything high quality
        if (itineraries.length < 4) {
            const explorers = scored
                .sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0)) // Sort by popularity for difference
                .slice(0, 3);

            if (explorers.length >= 2) {
                itineraries.push({
                    id: `gen-${hub.id}-explorer-${Date.now()}`,
                    hubId: hub.id,
                    archetype: 'balanced', // Re-using balanced
                    name: `Popular Local Spots`,
                    items: explorers.map((c, i) => ({ ...c, itemId: `item-${c.placeId}-${i}`, durationMinutes: 90, reason: 'Local favorite' })),
                    totalCostEstimate: avgBudget,
                    totalTravelMinutes: 45,
                    diversityScore: 0.85
                });
            }
        }
    }

    // Deduplicate by name if multiple hubs produced same names (unlikely with new logic but safe)
    // Filter to max 5 distinct
    const unique = itineraries.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);

    // If we have nothing, fallback
    if (unique.length === 0 && hubs.length > 0) {
        const fallbackHub = hubs[0];
        unique.push({
            id: `gen-fallback-${Date.now()}`,
            hubId: fallbackHub.id,
            archetype: 'relaxed',
            name: `Chill at ${fallbackHub.name}`,
            items: [],
            totalCostEstimate: avgBudget,
            totalTravelMinutes: 0,
            diversityScore: 0.5
        });
    }

    // Ensure we return at least a few if possible, but max 5
    return unique.slice(0, 5); // STRICT LIMIT: 5
}
