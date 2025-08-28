import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function findOptimalLocations(members: { name: string; location: string; budget: number; moodTags: string[] }[]) {
  try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const locations = members.map(member => member.location);
    const budgets = members.map(member => member.budget);
  const allMoodTags = members.flatMap(member => member.moodTags ?? []);
    const prompt = `
      I have a group of ${members.length} people located at: ${locations.join(', ')}. 
      Their budgets are: ${budgets.join(', ')} respectively.
      The group's preferred moods/tags are: ${allMoodTags.join(', ')}.
      Please find 4-5 optimal centroid meetup locations based on the groups location that are real, geocodable places (cities, towns, or well-known areas) convenient and equally fair for everyone to meet. Use travel time through trains for each member as a base. Do not suggest vague or fictional places.
      
      For each location, suggest a realistic itinerary of SPECIFIC activities that people actually do when they hangout. Focus on specific, named places and activities like:
      
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
      - "Go-Karting Track" or "Kart Attack" (not just "go-karting")
      - "Rock Climbing Wall" or "Climb Central" (not just "rock climbing")
      - "Mini Golf Course" or "Golf Course" (not just "mini golf")
      - "Billiards Club" or "Snooker Zone" (not just "billiards")
      - "Table Tennis Club" or "TT Zone" (not just "table tennis")
      
      SHOPPING & MALLS:
      - "Phoenix MarketCity" or "Inorbit Mall" (not just "mall")
      - "Reliance Digital" or "Croma" (not just "electronics store")
      - "Shoppers Stop" or "Pantaloons" (not just "clothing store")
      - "Big Bazaar" or "D-Mart" (not just "supermarket")
      - "Lifestyle" or "Central" (not just "department store")
      - "Crossword" or "Landmark" (not just "bookstore")
      
      OUTDOOR & ACTIVITIES:
      - "Central Park" or "Lodhi Garden" (not just "park")
      - "Marine Drive" or "Juhu Beach" (not just "beach")
      - "National Museum" or "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya" (not just "museum")
      - "Nehru Planetarium" or "Birla Planetarium" (not just "planetarium")
      - "Zoo" or "National Zoological Park" (not just "zoo")
      - "Botanical Garden" or "Lalbagh Botanical Garden" (not just "garden")
      - "Adventure Park" or "Rope Course" (not just "adventure")
      - "Water Park" or "Aqua Park" (not just "water park")
      - "Cycling Track" or "Bike Trail" (not just "cycling")
      - "Boating Lake" or "Boat Club" (not just "boating")
      
      SPORTS & FITNESS:
      - "Fitness First" or "Gold's Gym" (not just "gym")
      - "Sports Village" or "Sports Complex" (not just "sports center")
      - "Swimming Pool" or "Aqua Sports" (not just "pool")
      - "Tennis Court" or "Badminton Court" (not just "court")
      - "Cricket Ground" or "Cricket Academy" (not just "cricket")
      - "Football Ground" or "Football Academy" (not just "football")
      - "Basketball Court" or "Basketball Academy" (not just "basketball")
      - "Volleyball Court" or "Volleyball Academy" (not just "volleyball")
      - "Yoga Center" or "Yoga Studio" (not just "yoga")
      - "Dance Academy" or "Dance Studio" (not just "dance")
      
      CULTURAL & ARTS:
      - "National Gallery of Modern Art" (not just "art gallery")
      - "Bharat Bhavan" or "Cultural Center" (not just "cultural center")
      - "Rangoli Metro Art Center" (not just "art center")
      - "Art Gallery" or "Exhibition Center" (not just "gallery")
      - "Theater" or "Auditorium" (not just "theater")
      - "Music Academy" or "Music School" (not just "music")
      
      GAMING & TECH:
      - "GameStop" or "Gaming Zone" (not just "game store")
      - "Cyber Hub" or "Gurgaon Cyber City" (not just "tech hub")
      - "Gaming Cafe" or "Internet Cafe" (not just "cafe")
      - "Board Game Cafe" or "Card Game Center" (not just "board games")
      
             CRITICAL: Always suggest SPECIFIC places where you can actually DO the activity, not just the mall or area name. For example:
       - Say "Smaaash Bowling" (specific bowling place), not "Phoenix Mall" (just the mall)
       - Say "Timezone Arcade" (specific arcade), not "Inorbit Mall" (just the mall)
       - Say "Escape Room India" (specific escape room), not "Cyber Hub" (just the area)
       - Say "Laser Tag Arena" (specific laser tag place), not "Entertainment Zone" (just the zone)
       
       IMPORTANT: Always use specific, real business names that can be found on Google Maps. Do NOT use generic terms like "mall", "park", "restaurant". Use actual business names where you can actually do the activity.
      
      Choose 3-4 specific activities that fit within the average budget of ${budgets.reduce((a, b) => a + b, 0) / budgets.length} and match the group's mood tags. Each activity should be a specific, real place with a name.
      
      Format the response as JSON with this structure:
      {
        "locations": [
          {
            "name": "Location Name (must be a real, geocodable place)",
            "description": "Brief description of why this location is good for the group",
                         "itinerary": ["Specific Activity 1 (e.g., 'Smaaash Bowling')", "Specific Activity 2 (e.g., 'Starbucks Coffee')", "Specific Activity 3 (e.g., 'PVR Cinemas')"],
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