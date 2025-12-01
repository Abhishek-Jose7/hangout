import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize multiple Gemini API clients for load balancing
const geminiApiKeys = [
  process.env.GEMINI_API_KEY || '',
  process.env.GEMINI_API_KEY_2 || ''
].filter(key => key && key.trim() !== '');

let currentApiKeyIndex = 0;

// Function to get the next available API key
function getNextApiKey(): string {
  if (geminiApiKeys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }
  
  const apiKey = geminiApiKeys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % geminiApiKeys.length;
  return apiKey;
}

// Function to create a new Gemini client with the next API key
function createGeminiClient() {
  const apiKey = getNextApiKey();
  return new GoogleGenerativeAI(apiKey);
}

export async function findOptimalLocations(members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[], isDatePlanner: boolean = false, dateType: string = 'romantic') {
  let lastError: Error | null = null;
  
  // Try each API key until one works
  for (let attempt = 0; attempt < geminiApiKeys.length; attempt++) {
    try {
      const genAI = createGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const locations = members.map(member => member.location);
    const budgets = members.map(member => member.budget);
  const allMoodTags = members.flatMap(member => member.moodTags ?? []);
    
      // Only treat as date if explicitly requested through date planner feature
      const isDate = isDatePlanner && members.length === 2;

    const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

    // Check if any member has a preferred date set (for romantic suggestions)
    const hasPreferredDate = members.some(member => member.preferredDate);
    const preferredDateText = hasPreferredDate ? ` (some members have preferred dates set)` : '';

    const prompt = `
      I have a group of ${members.length} people located at: ${locations.join(', ')}.
      Their budgets are: ${budgets.join(', ')} respectively (average: ₹${averageBudget}).
      The group's preferred moods/tags are: ${allMoodTags.join(', ')}${preferredDateText}.

        ${isDate ?
          `This appears to be a ${dateType} date between 2 people${preferredDateText}. Suggest 3 REAL, EXISTING locations perfect for a ${dateType} date with activities that match the ${dateType} theme. Focus on creating memorable experiences appropriate for the date type.` :
        `Please find 3 optimal centroid meetup locations that are REAL, EXISTING places (specific neighborhoods, areas, or well-known districts) convenient and equally fair for everyone to meet. These must be actual places that exist on Google Maps.`
      }

      CRITICAL REQUIREMENTS FOR LOCATIONS:
      1. Location names MUST be real, existing places that can be found on Google Maps
      2. Use specific area names like "Bandra, Mumbai" or "Connaught Place, Delhi" - NOT generic terms
      3. Ensure the location is geographically between the members' locations (centroid)
      4. The location should be accessible by public transport
      5. Consider the budget constraints (₹${averageBudget} average)

      For each location, suggest a realistic itinerary of SPECIFIC activities that people actually do when they hangout. Focus on specific, named places and activities like:

        ${isDate ? `
        ${dateType.toUpperCase()} DATE ACTIVITIES (INDIA FOCUSED):
      CAFES & COZY SPOTS:
      - "Starbucks Coffee" or "Cafe Coffee Day" (romantic cafes)
      - "Chaayos" or "Chai Point" (cozy tea spots)
      - "The Piano Man Jazz Club" or "Hard Rock Cafe" (live music venues)
      - "Rooftop Cafe" or "Sky Lounge" (romantic dining)
      - "Book Cafe" or "Literature Lounge" (quiet reading spots)

      BEACHES & OUTDOOR ROMANCE:
      - "Juhu Beach" or "Marine Drive" (romantic walks)
      - "Lodhi Garden" or "Central Park" (peaceful outdoor spots)
      - "Nehru Planetarium" or "Observatory" (romantic stargazing)
      - "Boat Ride" or "Cruise" (romantic water activities)

      ENTERTAINMENT FOR COUPLES:
      - "PVR Cinemas" or "INOX" (romantic movies)
      - "Escape Room India" or "Breakout" (fun challenges)
      - "Karaoke Lounge" or "Singing Cafe" (fun activities)
      - "Art Gallery" or "Museum Cafe" (cultural experiences)

      SWEET TREATS:
      - "Cream Stone" or "Baskin Robbins" (ice cream dates)
      - "Chocolate Room" or "Dessert Cafe" (sweet treats)
      - "Wine Bar" or "Cocktail Lounge" (romantic drinks)
      ` : `
      SPECIFIC ACTIVITIES (use exact names) - INDIA FOCUSED:

      RESTAURANTS & FOOD:
      - "McDonald's" or "KFC" or "Domino's Pizza" (not just "restaurant")
      - "Starbucks Coffee" or "Cafe Coffee Day" (not just "cafe")
      - "Pizza Hut" or "Subway" (not just "fast food")
      - "Haldiram's" or "Bikanerwala" (not just "snacks")
      - "Barbeque Nation" or "Barista" (not just "restaurant")
      - "Cream Stone" or "Baskin Robbins" (not just "ice cream")
      - "Chaayos" or "Chai Point" (not just "tea shop")

      ENTERTAINMENT & ACTIVITIES:
      - "PVR Cinemas" or "INOX" or "Cinepolis" (not just "movie theater")
      - "Smaaash Bowling" or "Strike Bowling" or "Bowling Company" (not just "bowling")
      - "Timezone Arcade" or "Smaaash Arcade" (not just "arcade")
      - "Escape Room India" or "Breakout Escape Room" (not just "escape room")
      - "Karaoke Bar" or "Karaoke Lounge" (not just "karaoke")
      - "Laser Tag Arena" or "Laser Quest" (not just "laser tag")
      - "VR Gaming Zone" or "Virtual Reality Center" (not just "VR")
      - "Trampoline Park" or "Sky Zone" (not just "trampoline")
      - "Ice Skating Rink" or "Snow World" (not just "ice skating")
      - "Paintball Arena" or "Combat Zone" (not just "paintball")

      SHOPPING & MALLS:
      - "Phoenix MarketCity" or "Inorbit Mall" (not just "mall")
      - "Reliance Digital" or "Croma" (not just "electronics store")
      - "Shoppers Stop" or "Pantaloons" (not just "clothing store")
      - "Big Bazaar" or "D-Mart" (not just "supermarket")
      - "Lifestyle" or "Central" (not just "department store")

      OUTDOOR & ACTIVITIES:
      - "Central Park" or "Lodhi Garden" (not just "park")
      - "Marine Drive" or "Juhu Beach" (not just "beach")
      - "National Museum" or "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya" (not just "museum")
      - "Nehru Planetarium" or "Birla Planetarium" (not just "planetarium")
      - "Zoo" or "National Zoological Park" (not just "zoo")
      - "Botanical Garden" or "Lalbagh Botanical Garden" (not just "garden")
      `}

             CRITICAL: Always suggest SPECIFIC places where you can actually DO the activity, not just the mall or area name. For example:
       - Say "Smaaash Bowling" (specific bowling place), not "Phoenix Mall" (just the mall)
       - Say "Starbucks Coffee" (specific cafe), not "Coffee Shop" (generic)
       - Say "Juhu Beach" (specific beach), not "Beach" (generic)
       - Say "PVR Cinemas" (specific cinema), not "Movie Theater" (generic)

       IMPORTANT: Always use specific, real business names that can be found on Google Maps. Do NOT use generic terms like "mall", "park", "restaurant". Use actual business names where you can actually do the activity.

      Choose 3-4 specific activities that fit within the average budget of ₹${averageBudget} and match the group's mood tags. Each activity should be a specific, real place with a name.

      CRITICAL RULES FOR ITINERARY:
      1. Use ONLY specific, real business names (e.g., "Starbucks", "KFC", "PVR Cinemas")
      2. DO NOT use generic terms (e.g., "restaurant", "mall", "cafe")
      3. DO NOT include the location name itself as an itinerary item
      4. Ensure each activity can be found on Google Maps
      5. Activities should be within walking distance or short commute from each other
      6. Total estimated cost should not exceed the average budget by more than 20%

      QUALITY CHECKS:
      - Each itinerary item must be a specific, named business or landmark
      - All activities must be appropriate for the group's mood tags
      - The location must be a real place that exists (verifiable on Google Maps)

      Format the response as VALID JSON with this EXACT structure:
      {
        "locations": [
          {
            "name": "Exact Location Name, City (e.g., 'Bandra West, Mumbai')",
            "description": "Why this location is ideal: accessibility, activities, budget fit",
            "itinerary": ["Activity 1: Specific Place Name", "Activity 2: Specific Place Name", "Activity 3: Specific Place Name"],
            "estimatedCost": 500
          }
        ]
      }

      EXAMPLE OF GOOD OUTPUT:
      {
        "locations": [
          {
            "name": "Indiranagar, Bangalore",
            "description": "Vibrant neighborhood with cafes, restaurants, and entertainment options, centrally located with good metro connectivity",
            "itinerary": ["Breakfast at Third Wave Coffee", "Shopping at Chinmaya Mission Hospital Road", "Lunch at Toit Brewpub", "Movie at PVR Cinemas Forum Mall"],
            "estimatedCost": 800
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('Gemini API raw response:', text);
    
    // Try to extract and validate JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.locations || !Array.isArray(parsed.locations)) {
        throw new Error('Invalid response structure: missing locations array');
      }
      
      // Validate each location
      const validatedLocations = parsed.locations
        .filter((loc: { name?: string; description?: string; itinerary?: string[]; estimatedCost?: number }) => {
          // Must have all required fields
          if (!loc.name || !loc.description || !loc.itinerary || !loc.estimatedCost) {
            console.warn('Skipping invalid location:', loc);
            return false;
          }
          
          // Location name must be specific (contain city/area)
          if (loc.name.length < 5 || !loc.name.includes(',')) {
            console.warn('Skipping generic location name:', loc.name);
            return false;
          }
          
          // Must have at least 2 itinerary items
          if (!Array.isArray(loc.itinerary) || loc.itinerary.length < 2) {
            console.warn('Skipping location with insufficient itinerary:', loc.name);
            return false;
          }
          
          // Itinerary items must be specific (not too short or generic)
          const hasGenericItems = loc.itinerary.some((item: string) => {
            const itemLower = item.toLowerCase();
            const locationName = loc.name ? loc.name.toLowerCase() : '';
            const genericTerms = ['restaurant', 'cafe', 'mall', 'park', 'beach', 'cinema', 'the location', locationName];
            return item.length < 5 || genericTerms.some(term => itemLower === term || itemLower.endsWith(term));
          });
          
          if (hasGenericItems) {
            console.warn('Skipping location with generic itinerary items:', loc.name);
            return false;
          }
          
          // Cost must be reasonable
          if (loc.estimatedCost < 50 || loc.estimatedCost > averageBudget * 2) {
            console.warn('Skipping location with unreasonable cost:', loc.name, loc.estimatedCost);
            return false;
          }
          
          return true;
        });
      
      if (validatedLocations.length === 0) {
        throw new Error('No valid locations after validation');
      }
      
      console.log(`Validated ${validatedLocations.length} locations out of ${parsed.locations.length}`);
      
      return { locations: validatedLocations };
    } catch (err) {
      console.error('Gemini API parsing/validation error:', err, '\nRaw response:', text);
      throw new Error('Gemini API failed to return valid locations. Please try again.');
    }
  } catch (error) {
      console.error(`Error with API key attempt ${attempt + 1}:`, error);
      lastError = error as Error;
      
      // If this is a rate limit error, try the next API key
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`Rate limit hit on API key ${attempt + 1}, trying next key...`);
        continue;
      }
      
      // If this is not a rate limit error, break out of the loop
      break;
    }
  }
  
  // If all API keys failed, return fallback
  console.error('All Gemini API keys failed. Last error:', lastError);
    return {
      locations: [
        {
          name: "Sample Location",
          description: "This is a fallback location since the API call failed",
          itinerary: ["Visit local attractions", "Have a group meal", "Explore the area"],
          estimatedCost: 100
        }
      ]
    };
  }

export async function findOptimalDateItineraries(dateData: { location: string; budget: number; timePeriod: string; moodTags: string[]; dateType: string }) {
  let lastError: Error | null = null;
  
  // Try each API key until one works
  for (let attempt = 0; attempt < geminiApiKeys.length; attempt++) {
    try {
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
      const { location, budget, timePeriod, moodTags, dateType } = dateData;

      const prompt = `
        Create 2-3 perfect date itineraries for a ${dateType} date in ${location} with a budget of ₹${budget} for a ${timePeriod} experience.
        
        The couple is interested in: ${moodTags.join(', ')}
        
        IMPORTANT REQUIREMENTS:
        1. Focus on ACTUAL ACTIVITIES, not just restaurant or mall names
        2. Each itinerary should have 3-5 specific activities
        3. Include reasoning for why each activity is perfect for this type of date
        4. Consider the time period: ${timePeriod}
        5. Stay within budget: ₹${budget}
        6. Make activities specific to ${location}
        7. Include duration and cost estimates for each activity
        8. Explain the reasoning behind the overall itinerary choice
        
        ACTIVITY EXAMPLES (specific places with activities):
        - "Take a pottery class at Clay Station Pottery Studio in ${location}"
        - "Go for a sunset photography walk at Lodhi Garden in ${location}"
        - "Visit the National Gallery of Modern Art and discuss your favorite pieces"
        - "Try street food at Chandni Chowk market in ${location}"
        - "Take a boat ride on the Yamuna River and enjoy the city skyline"
        - "Go to The Piano Man Jazz Club for live performances"
        - "Visit the Red Fort and learn about its historical significance"
        - "Have a picnic at India Gate lawns"
        - "Go to the Dilli Haat cultural festival"
        - "Take a walking tour of Old Delhi's hidden gems"
        
        IMPORTANT: For each activity, provide:
        1. Specific place name (e.g., "Clay Station Pottery Studio", "Lodhi Garden")
        2. General area/neighborhood in ${location}
        3. What you'll actually do there
        4. Why it's perfect for a ${dateType} date
        
        Format the response as VALID JSON with this EXACT structure:
        {
          "itineraries": [
            {
              "name": "Creative Itinerary Name",
              "description": "Brief description of what makes this itinerary special",
              "activities": [
                {
                  "name": "Specific Activity Name",
                  "description": "Detailed description of what you'll do and why it's perfect",
                  "duration": "X hours",
                  "cost": "₹XXX-XXX"
                }
              ],
              "totalCost": 800,
              "reasoning": "Explain why this itinerary is perfect for a ${dateType} date, considering the location, budget, time period, and interests"
            }
          ]
        }
        
        Make each itinerary unique and tailored to different aspects of the couple's interests.
        Focus on creating memorable experiences, not just visiting places.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      console.log('Gemini API raw response for date itineraries:', text);
      
      // Try to extract and validate JSON from the response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        if (!parsed.itineraries || !Array.isArray(parsed.itineraries)) {
          throw new Error('Invalid response structure: missing itineraries array');
        }
        
        // Validate each itinerary
        const validatedItineraries = parsed.itineraries
          .filter((itinerary: { name?: string; description?: string; activities?: Array<{ name: string; description: string; duration: string; cost: string }>; totalCost?: number; reasoning?: string }) => {
            // Must have all required fields
            if (!itinerary.name || !itinerary.description || !itinerary.activities || !itinerary.totalCost || !itinerary.reasoning) {
              console.warn('Skipping invalid itinerary:', itinerary);
              return false;
            }
            
            // Must have at least 3 activities
            if (!Array.isArray(itinerary.activities) || itinerary.activities.length < 3) {
              console.warn('Skipping itinerary with insufficient activities:', itinerary.name);
              return false;
            }
            
            // Cost must be reasonable
            if (itinerary.totalCost < 100 || itinerary.totalCost > budget * 1.5) {
              console.warn('Skipping itinerary with unreasonable cost:', itinerary.name, itinerary.totalCost);
              return false;
            }
            
            return true;
          });
        
        if (validatedItineraries.length === 0) {
          throw new Error('No valid itineraries after validation');
        }
        
        console.log(`Validated ${validatedItineraries.length} itineraries out of ${parsed.itineraries.length}`);
        
        return { itineraries: validatedItineraries };
      } catch (err) {
        console.error('Gemini API parsing/validation error:', err, '\nRaw response:', text);
        throw new Error('Gemini API failed to return valid itineraries. Please try again.');
      }
    } catch (error) {
      console.error(`Error with API key attempt ${attempt + 1}:`, error);
      lastError = error as Error;
      
      // If this is a rate limit error, try the next API key
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`Rate limit hit on API key ${attempt + 1}, trying next key...`);
        continue;
      }
      
      // If this is not a rate limit error, break out of the loop
      break;
    }
  }
  
  // If all API keys failed, return fallback
  console.error('All Gemini API keys failed. Last error:', lastError);
  return {
    itineraries: [
      {
        name: "Sample Itinerary",
        description: "This is a fallback itinerary since the API call failed",
        activities: [
          {
            name: "Visit local attractions",
            description: "Explore the area together",
            duration: "2-3 hours",
            cost: "₹200-500"
          },
          {
            name: "Have a meal together",
            description: "Enjoy local cuisine",
            duration: "1-2 hours",
            cost: "₹300-800"
          },
          {
            name: "Take a walk and chat",
            description: "Spend quality time together",
            duration: "1 hour",
            cost: "₹0"
          }
        ],
        totalCost: 500,
        reasoning: "A simple fallback itinerary for when the AI service is unavailable"
      }
    ]
  };
}