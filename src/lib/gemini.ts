import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function findOptimalLocations(members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[]) {
  try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const locations = members.map(member => member.location);
    const budgets = members.map(member => member.budget);
  const allMoodTags = members.flatMap(member => member.moodTags ?? []);
    // Check if this is for a romantic date (based on mood tags and number of people)
    const isRomanticDate = members.length === 2 &&
      (allMoodTags.some(tag => ['romantic', 'cozy', 'intimate', 'date'].includes(tag.toLowerCase())) ||
       allMoodTags.includes('Culture') || allMoodTags.includes('Food'));

    const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

    // Check if any member has a preferred date set (for romantic suggestions)
    const hasPreferredDate = members.some(member => member.preferredDate);
    const preferredDateText = hasPreferredDate ? ` (some members have preferred dates set)` : '';

    const prompt = `
      I have a group of ${members.length} people located at: ${locations.join(', ')}.
      Their budgets are: ${budgets.join(', ')} respectively (average: ${averageBudget}).
      The group's preferred moods/tags are: ${allMoodTags.join(', ')}${preferredDateText}.

      ${isRomanticDate ?
        `This appears to be a romantic date between 2 people${preferredDateText}. Suggest locations perfect for a romantic date with activities like cafes, beaches, movies, romantic walks, rooftop dining, live music venues, etc. Focus on intimate, cozy, and memorable experiences.` :
        `Please find 4-5 optimal centroid meetup locations based on the groups location that are real, geocodable places (cities, towns, or well-known areas) convenient and equally fair for everyone to meet.`
      }

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

      Choose 3-4 specific activities that fit within the average budget of ${averageBudget} and match the group's mood tags. Each activity should be a specific, real place with a name.

      Format the response as JSON with this structure:
      {
        "locations": [
          {
            "name": "Location Name (must be a real, geocodable place)",
            "description": "Brief description of why this location is good for the group",
                         "itinerary": ["Specific Activity 1 (e.g., 'Starbucks Coffee')", "Specific Activity 2 (e.g., 'Juhu Beach')", "Specific Activity 3 (e.g., 'PVR Cinemas')"],
            "estimatedCost": 123
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('Gemini API raw response:', text);
    // Try to extract JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse Gemini API response');
    } catch (err) {
      console.error('Gemini API parsing error:', err, '\nRaw response:', text);
      throw new Error('Gemini API failed to return valid locations. Please check your API key and prompt.');
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