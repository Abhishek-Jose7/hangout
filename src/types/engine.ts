// Smart Itinerary Engine Types

export interface Hub {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'centroid' | 'cluster' | 'poi';
    score: number;
}

export type PlaceCategory =
    | 'catering.restaurant'
    | 'catering.cafe'
    | 'catering.bar'
    | 'entertainment'
    | 'entertainment.cinema'
    | 'leisure.park'
    | 'commercial.shopping_mall';

export interface MoodConfig {
    tags: string[];
    geoapifyCategories: string[]; // e.g., ["catering.restaurant", "catering.cafe"]
    keywords: string[];
}

export interface Candidate {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    categories: string[];
    rating?: number;
    userRatingsTotal?: number;
    priceLevel?: number;
    photos?: string[];

    // Computed scores
    scores?: {
        total: number;
        distance: number;
        tagMatch: number;
        rating: number;
        budget: number;
    };
}

export interface ItineraryItem extends Candidate {
    itemId: string; // Unique for this itinerary instance
    startTime?: string;
    durationMinutes: number;
    reason: string; // "Why this place?" explanation
}

export type ItineraryArchetype = 'foodie' | 'adventure' | 'relaxed' | 'balanced' | 'budget' | 'premium';

export interface GeneratedItinerary {
    id: string; // Snapshot ID equivalent
    hubId: string;
    archetype: ItineraryArchetype;
    name: string; // e.g., "Andheri Food Crawl"
    items: ItineraryItem[];

    // Aggregated metrics
    totalCostEstimate: number;
    totalTravelMinutes: number;
    diversityScore: number;
}

export interface EnginePreferences {
    budgetLevel: 1 | 2 | 3 | 4; // 1=Cheap, 4=Luxury
    maxTravelTimeMinutes: number;
    moodTags: string[];
    archetypePreference?: ItineraryArchetype[];
}
