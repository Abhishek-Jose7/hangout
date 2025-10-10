import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function findOptimalLocations(members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[], isDatePlanner: boolean = false) {
  try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const locations = members.map(member => member.location);
    const budgets = members.map(member => member.budget);
  const allMoodTags = members.flatMap(member => member.moodTags ?? []);
    
    // Only treat as romantic date if explicitly requested through date planner feature
    const isRomanticDate = isDatePlanner && members.length === 2;

    const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

    // Check if any member has a preferred date set (for romantic suggestions)
    const hasPreferredDate = members.some(member => member.preferredDate);
    const preferredDateText = hasPreferredDate ? ` (some members have preferred dates set)` : '';

    const prompt = `
      I have a group of ${members.length} people located at: ${locations.join(', ')}.
      Their budgets are: ${budgets.join(', ')} respectively (average: ₹${averageBudget}).
      The group's preferred moods/tags are: ${allMoodTags.join(', ')}${preferredDateText}.

      ${isRomanticDate ?
        `This appears to be a romantic date between 2 people${preferredDateText}. Suggest 3 REAL, EXISTING locations perfect for a romantic date with activities like cafes, beaches, movies, romantic walks, rooftop dining, live music venues, etc. Focus on intimate, cozy, and memorable experiences.` :
        `Please find 3 optimal centroid meetup locations that are REAL, EXISTING places (specific neighborhoods, areas, or well-known districts) convenient and equally fair for everyone to meet. These must be actual places that exist on Google Maps.`
      }

      CRITICAL REQUIREMENTS FOR LOCATIONS:
      1. Location names MUST be real, existing places that can be found on Google Maps
      2. Use specific area names like "Bandra, Mumbai" or "Connaught Place, Delhi" - NOT generic terms
      3. Ensure the location is geographically between the members' locations (centroid)
      4. The location should be accessible by public transport
      5. Consider the budget constraints (₹${averageBudget} average)

      For each location, suggest a realistic itinerary of SPECIFIC activities that people actually do when they hangout. Focus on specific, named places and activities like:

      ${isRomanticDate ? `
      ROMANTIC DATE ACTIVITIES (INDIA FOCUSED):
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
    console.error('Error calling Gemini API:', error);
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
}