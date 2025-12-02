import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchPlacesByMood, findOptimalMeetingPoint, categorizePlaces, type Place, type ScrapedPlace } from './places';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Itinerary {
    name: string;
    description: string;
    itinerary: string[];
    estimatedCost: number;
    places?: {
        name: string;
        rating: number;
        address: string;
        activity: string;
    }[];
    realPlaces?: boolean;
    discoveredPlaces?: ScrapedPlace[];
}

export async function findOptimalLocations(
    members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[],
    isDatePlanner: boolean = false,
    dateType: string = 'romantic'
) {
    try {
        const locations = members.map(member => member.location);
        const budgets = members.map(member => member.budget);
        const allMoodTags = members.flatMap(member => member.moodTags ?? []);
        const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

        console.log('Finding optimal locations for:', { locations, allMoodTags, averageBudget });

        // Step 1: Find optimal meeting point
        const meetingPoint = await findOptimalMeetingPoint(locations);
        console.log('Optimal meeting point:', meetingPoint);

        // Step 2: Discover real places based on mood tags
        // Updated signature: removed radius and minRating
        const discoveredPlaces = await searchPlacesByMood(meetingPoint, allMoodTags);

        console.log(`Discovered ${discoveredPlaces.length} real places`);

        if (discoveredPlaces.length === 0) {
            console.warn('No places discovered, falling back to AI-only suggestions');
            return await fallbackToAIOnly(members, isDatePlanner, dateType);
        }

        // Step 3: Categorize places
        const categorized = categorizePlaces(discoveredPlaces);

        // Step 4: Create curated itineraries using real places
        const itineraries = await createItinerariesWithRealPlaces(
            categorized,
            allMoodTags,
            averageBudget,
            meetingPoint,
            members.length,
            isDatePlanner
        );

        if (itineraries.length === 0) {
            console.warn('No valid itineraries created, falling back to AI-only');
            return await fallbackToAIOnly(members, isDatePlanner, dateType);
        }

        return { locations: itineraries };
    } catch (error) {
        console.error('Error in findOptimalLocations:', error);
        return await fallbackToAIOnly(members, isDatePlanner, dateType);
    }
}

async function createItinerariesWithRealPlaces(
    categorized: Record<string, Place[]>,
    moodTags: string[],
    budget: number,
    location: string,
    groupSize: number,
    isDate: boolean
): Promise<Itinerary[]> {
    try {
        // Create 2-3 different themed itineraries
        const itineraries: Itinerary[] = [];

        // Itinerary 1: Food & Culture (if applicable)
        const isFoodOrCulture = moodTags.some(t =>
            ['Cafe Hopping', 'Street Food', 'Fine Dining', 'Museum/History', 'Workshop/Class', 'Food', 'Culture'].includes(t)
        );

        if (isFoodOrCulture &&
            (categorized.dining.length > 0 || categorized.attractions.length > 0)) {
            const foodCulturePlaces = [
                ...categorized.dining.slice(0, 2),
                ...categorized.attractions.slice(0, 2)
            ].slice(0, 4);

            if (foodCulturePlaces.length >= 3) {
                const itinerary = await generateItineraryNarrative(
                    foodCulturePlaces,
                    'Food & Culture Explorer',
                    location,
                    budget,
                    moodTags,
                    isDate
                );
                if (itinerary) itineraries.push(itinerary);
            }
        }

        // Itinerary 2: Entertainment & Fun
        const isFunOrAdventure = moodTags.some(t =>
            ['Bowling/Arcade', 'Movie Night', 'Clubbing/Bar', 'Adventure Sports', 'Adventure', 'Entertainment', 'Nightlife'].includes(t)
        );

        if (isFunOrAdventure) {
            const funPlaces = [
                ...categorized.entertainment.slice(0, 2),
                ...categorized.attractions.slice(0, 1),
                ...categorized.dining.slice(0, 1)
            ].slice(0, 4);

            if (funPlaces.length >= 3) {
                const itinerary = await generateItineraryNarrative(
                    funPlaces,
                    'Adventure & Entertainment',
                    location,
                    budget,
                    moodTags,
                    isDate
                );
                if (itinerary) itineraries.push(itinerary);
            }
        }

        // Itinerary 3: Relaxation & Wellness
        const isRelaxOrNature = moodTags.some(t =>
            ['Nature Walk', 'Spa/Relaxation', 'Relaxation', 'Nature'].includes(t)
        );

        if (isRelaxOrNature) {
            const relaxPlaces = [
                ...categorized.wellness.slice(0, 1),
                ...categorized.attractions.filter(p =>
                    p.types.some(t => ['park', 'spa'].includes(t))
                ).slice(0, 2),
                ...categorized.dining.slice(0, 1)
            ].slice(0, 4);

            if (relaxPlaces.length >= 3) {
                const itinerary = await generateItineraryNarrative(
                    relaxPlaces,
                    'Relaxation & Rejuvenation',
                    location,
                    budget,
                    moodTags,
                    isDate
                );
                if (itinerary) itineraries.push(itinerary);
            }
        }

        // Itinerary 4: Mixed/Balanced (always create this)
        const mixedPlaces = [
            categorized.dining[0],
            categorized.attractions[0] || categorized.entertainment[0],
            categorized.dining[1] || categorized.shopping[0],
            categorized.entertainment[0] || categorized.attractions[1]
        ].filter(Boolean).slice(0, 4);

        if (mixedPlaces.length >= 3) {
            const itinerary = await generateItineraryNarrative(
                mixedPlaces,
                'Balanced Experience',
                location,
                budget,
                moodTags,
                isDate
            );
            if (itinerary) itineraries.push(itinerary);
        }

        return itineraries.slice(0, 3); // Return top 3 itineraries
    } catch (error) {
        console.error('Error creating itineraries:', error);
        return [];
    }
}

async function generateItineraryNarrative(
    places: Place[],
    theme: string,
    location: string,
    budget: number,
    moodTags: string[],
    isDate: boolean
): Promise<Itinerary | null> {
    try {
        const placesList = places.map(p =>
            `${p.name} (${p.rating}⭐, ${p.userRatingsTotal} reviews) - ${p.address}`
        ).join('\n');

        const prompt = `Create a compelling narrative for a ${theme} themed ${isDate ? 'date' : 'group hangout'} itinerary in ${location}.

REAL PLACES DISCOVERED (with ratings):
${placesList}

Requirements:
- Budget: ₹${budget}
- Interests: ${moodTags.join(', ')}
- Must use ONLY the places listed above
- Create a logical flow between these places
- Estimate realistic costs based on place types

Return ONLY valid JSON (no markdown) in this format:
{
  "name": "${location} - ${theme}",
  "description": "A compelling 2-3 sentence description of why this itinerary is special",
  "itinerary": ["Activity at ${places[0]?.name}", "Activity at ${places[1]?.name}", ...],
  "estimatedCost": ${Math.floor(budget * 0.8)},
  "places": [
    {
      "name": "${places[0]?.name}",
      "rating": ${places[0]?.rating},
      "address": "${places[0]?.address}",
      "activity": "What to do here (1 sentence)"
    }
  ]
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse response
        let jsonText = text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        // Add real place metadata
        return {
            ...parsed,
            realPlaces: true,
            discoveredPlaces: places.map(p => ({
                name: p.name,
                rating: p.rating,
                reviews: p.userRatingsTotal,
                address: p.address,
                placeId: p.placeId
            }))
        };
    } catch (error) {
        console.error('Error generating narrative:', error);
        return null;
    }
}

async function fallbackToAIOnly(
    members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[],
    isDatePlanner: boolean,
    dateType: string
) {
    console.log('Using AI-only fallback mode');

    const locations = members.map(member => member.location);
    const budgets = members.map(member => member.budget);
    const allMoodTags = members.flatMap(member => member.moodTags ?? []);
    const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

    const prompt = `Create 2-3 location suggestions for a ${isDatePlanner ? `date (${dateType})` : 'group hangout'} for people from ${locations.join(', ')}.

Budget: ₹${averageBudget}
Interests: ${allMoodTags.join(', ')}

Return ONLY valid JSON with real, highly-rated places in India:
{
  "locations": [
    {
      "name": "Specific Area, City",
      "description": "Why this location is perfect",
      "itinerary": ["Real specific place/restaurant/cafe name", "Another real place", "Third real place"],
      "estimatedCost": ${Math.floor(averageBudget * 0.8)}
    }
  ]
}`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let jsonText = text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Fallback AI error:', error);
        return {
            locations: [
                {
                    name: locations[0] || "Mumbai",
                    description: "A great place to hang out.",
                    itinerary: ["Visit a local cafe", "Walk in the park", "Dinner at a nice restaurant"],
                    estimatedCost: averageBudget
                }
            ]
        };
    }
}

export async function findOptimalDateItineraries(dateData: { location: string; budget: number; timePeriod: string; moodTags: string[]; dateType: string }) {
    // Reuse the main logic but wrap it for date specific request
    const result = await findOptimalLocations(
        [{ name: 'User', location: dateData.location, budget: dateData.budget, moodTags: dateData.moodTags, preferredDate: null }],
        true,
        dateData.dateType
    );

    if (result && result.locations) {
        return {
            success: true,
            itineraries: result.locations.map((loc: Itinerary) => ({
                name: loc.name,
                description: loc.description,
                activities: loc.itinerary.map((item: string) => ({
                    name: item,
                    description: 'Activity',
                    duration: '1-2 hours',
                    cost: '₹500-1000'
                })),
                totalCost: loc.estimatedCost,
                reasoning: loc.description
            }))
        };
    }

    return { success: false, error: 'Failed to generate itineraries' };
}
