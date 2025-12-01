import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { findOptimalDateItineraries } from '@/lib/ai';
import { isGeoapifyHealthy, searchPlace } from '@/lib/geoapify';

type Activity = {
  name: string;
  description: string;
  duration: string;
  cost: string;
};

type Itinerary = {
  name: string;
  description: string;
  activities: Activity[];
  totalCost: number;
  reasoning: string;
};

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      location,
      budget,
      timePeriod,
      moodTags,
      dateType = 'romantic' // romantic, casual, adventure, etc.
    } = body;

    // Validate required fields
    if (!location || !budget || !moodTags || moodTags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Location, budget, and mood tags are required' },
        { status: 400 }
      );
    }

    // Format data for the Gemini API with date-specific context
    const dateData = {
      location: location.trim(),
      budget: parseFloat(budget),
      timePeriod,
      moodTags: Array.isArray(moodTags) ? moodTags : moodTags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      dateType
    };

    // Helper function to generate fallback itineraries for dates
    function generateFallbackDateItineraries(dateData: { location: string; budget: number; timePeriod: string; moodTags: string[]; dateType: string }) {
      const { budget, moodTags, dateType } = dateData;

      // Generate 2-3 activity-focused itineraries based on date type and mood
      const itineraries = [];

      if (dateType === 'romantic') {
        itineraries.push(
          {
            name: "Romantic Garden Stroll",
            description: "A peaceful and intimate experience perfect for deep conversations and romantic moments",
            activities: [
              {
                name: "Morning Coffee at a Cozy Café",
                description: "Start your date with warm beverages and light conversation in a quiet, romantic setting",
                duration: "30-45 minutes",
                cost: "₹200-300"
              },
              {
                name: "Walk Through a Beautiful Garden or Park",
                description: "Enjoy nature together, take photos, and have meaningful conversations in a serene environment",
                duration: "1-2 hours",
                cost: "₹0-100"
              },
              {
                name: "Romantic Lunch at a Rooftop Restaurant",
                description: "Dine with a view, share stories, and create memories over delicious food",
                duration: "1-1.5 hours",
                cost: "₹800-1200"
              },
              {
                name: "Sunset Photography Session",
                description: "Capture beautiful moments together as the sun sets, creating lasting memories",
                duration: "30-45 minutes",
                cost: "₹0"
              }
            ],
            totalCost: Math.min(budget, 1000),
            reasoning: "This itinerary focuses on intimate moments, meaningful conversations, and creating lasting memories together. It's perfect for couples who want to connect on a deeper level while enjoying beautiful surroundings."
          }
        );
      }

      if (dateType === 'adventure' || moodTags.includes('Adventure')) {
        itineraries.push(
          {
            name: "Adventure & Exploration Day",
            description: "An exciting and active date filled with new experiences and shared adventures",
            activities: [
              {
                name: "Early Morning Nature Walk or Trek",
                description: "Start with an invigorating outdoor activity to energize both of you",
                duration: "1-2 hours",
                cost: "₹0-200"
              },
              {
                name: "Visit a Local Museum or Art Gallery",
                description: "Explore culture together, learn something new, and discuss your thoughts on art and history",
                duration: "1-1.5 hours",
                cost: "₹100-300"
              },
              {
                name: "Try a New Cuisine or Street Food",
                description: "Be adventurous with food, try something neither of you has had before",
                duration: "45-60 minutes",
                cost: "₹300-600"
              },
              {
                name: "Fun Activity: Bowling, Mini Golf, or Arcade",
                description: "End with some playful competition and laughter to keep the mood light and fun",
                duration: "1-1.5 hours",
                cost: "₹400-800"
              }
            ],
            totalCost: Math.min(budget, 1200),
            reasoning: "This itinerary balances physical activity with cultural exploration and fun. It's designed for couples who enjoy trying new things together and want an active, engaging date experience."
          }
        );
      }

      if (dateType === 'casual' || moodTags.includes('Food') || moodTags.includes('Culture')) {
        itineraries.push(
          {
            name: "Cultural & Culinary Experience",
            description: "A relaxed exploration of local culture, food, and entertainment",
            activities: [
              {
                name: "Visit a Local Market or Bazaar",
                description: "Explore local culture, try street food, and shop for unique items together",
                duration: "1-2 hours",
                cost: "₹200-500"
              },
              {
                name: "Coffee and Dessert at a Charming Café",
                description: "Take a break to chat, people-watch, and enjoy sweet treats in a cozy atmosphere",
                duration: "45-60 minutes",
                cost: "₹300-500"
              },
              {
                name: "Visit a Local Landmark or Historical Site",
                description: "Learn about the area's history together and take memorable photos",
                duration: "1-1.5 hours",
                cost: "₹100-300"
              },
              {
                name: "Evening Entertainment: Movie or Live Music",
                description: "End the day with entertainment that matches your interests - cinema or live music",
                duration: "2-3 hours",
                cost: "₹400-800"
              }
            ],
            totalCost: Math.min(budget, 1500),
            reasoning: "This itinerary offers a perfect blend of cultural immersion and relaxation. It's ideal for couples who want to explore their city together while enjoying good food and entertainment in a comfortable, unhurried way."
          }
        );
      }

      return itineraries.slice(0, 3);
    }

    // Get optimal itineraries using Gemini API with fallback
    let itineraries = [];
    let usedFallback = false;

    try {
      // Call a new function for date itineraries
      const itinerariesResult = await findOptimalDateItineraries(dateData);
      itineraries = itinerariesResult.itineraries || [];
    } catch (geminiError: unknown) {
      console.error('Gemini API error:', geminiError);

      // Use fallback itineraries instead of returning error
      console.log('Using fallback itineraries due to API error');
      itineraries = generateFallbackDateItineraries(dateData);
      usedFallback = true;
    }

    // Check if Geoapify API is working
    const geoapifyHealthy = await isGeoapifyHealthy();
    console.log('Geoapify API healthy:', geoapifyHealthy);

    // Helper function to fetch place details from Geoapify
    async function fetchPlaceDetails(placeName: string, location: string) {
      if (!geoapifyHealthy) {
        return {
          name: placeName,
          address: `${placeName}, ${location}`,
          rating: null,
          photos: [],
          priceLevel: null,
          placeId: '',
          mapsLink: `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName + ' ' + location)}`,
          reviews: [],
          userRatingsTotal: 0
        };
      }

      try {
        // Use Geoapify to search for the place
        const placeDetails = await searchPlace(placeName, location);
        return placeDetails;
      } catch (error) {
        console.error(`Error fetching place details for '${placeName}':`, error);
        return {
          name: placeName,
          address: `${placeName}, ${location}`,
          rating: null,
          photos: [],
          priceLevel: null,
          placeId: '',
          mapsLink: `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName + ' ' + location)}`,
          reviews: [],
          userRatingsTotal: 0
        };
      }
    }

    // Enhance itineraries with actual place details
    const enhancedItineraries = await Promise.all(itineraries.map(async (itinerary: Itinerary) => {
      const enhancedActivities = await Promise.all(itinerary.activities.map(async (activity: Activity) => {
        const placeDetails = await fetchPlaceDetails(activity.name, dateData.location);
        return {
          ...activity,
          placeDetails
        };
      }));

      return {
        ...itinerary,
        activities: enhancedActivities
      };
    }));

    return NextResponse.json({
      success: true,
      itineraries: enhancedItineraries,
      usedFallback: usedFallback,
      dateType: dateType,
      message: usedFallback ? 'Using curated date itineraries due to high demand. These are proven, popular date activities!' : undefined
    });
  } catch (error) {
    console.error('Error finding duo date locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find duo date locations' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
