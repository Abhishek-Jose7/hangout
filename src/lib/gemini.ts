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
      
      SPECIFIC ACTIVITIES (use exact names):
      - "Dave & Buster's Arcade" (not just "arcade")
      - "AMF Bowling Center" (not just "bowling")
      - "Starbucks Coffee" or "Dunkin' Donuts" (not just "cafe")
      - "Metropolitan Museum of Art" (not just "museum")
      - "Central Park" or "Golden Gate Park" (not just "park")
      - "Santa Monica Beach" (not just "beach")
      - "Westfield Shopping Center" (not just "mall")
      - "AMC Theaters" or "Regal Cinemas" (not just "movie theater")
      - "Escape Room LA" (not just "escape room")
      - "TopGolf" (not just "golf")
      - "Karaoke Box" (not just "karaoke")
      - "Chipotle Mexican Grill" or "McDonald's" (not just "restaurant")
      - "Snakes & Lattes Board Game Cafe" (not just "board game cafe")
      - "Sky Zone Trampoline Park" (not just "trampoline park")
      - "Laser Quest" (not just "laser tag")
      - "Ice Palace Skating Rink" (not just "ice skating")
      - "Brooklyn Botanic Garden" (not just "botanical garden")
      - "Monterey Bay Aquarium" (not just "aquarium")
      - "San Diego Zoo" (not just "zoo")
      - "LA Fitness" or "Planet Fitness" (not just "gym")
      
      MORE SPECIFIC EXAMPLES:
      - "Target" or "Walmart" (not just "store")
      - "McDonald's" or "Burger King" (not just "fast food")
      - "Pizza Hut" or "Domino's" (not just "pizza place")
      - "Subway" or "Quiznos" (not just "sandwich shop")
      - "Baskin-Robbins" or "Dairy Queen" (not just "ice cream")
      - "GameStop" (not just "game store")
      - "Barnes & Noble" (not just "bookstore")
      - "Best Buy" (not just "electronics store")
      - "Home Depot" or "Lowe's" (not just "hardware store")
      - "PetSmart" or "Petco" (not just "pet store")
      
      IMPORTANT: Always use specific, real business names that can be found on Google Maps. Do NOT use generic terms like "mall", "park", "restaurant". Use actual business names like "Target", "Walmart", "McDonald's", "Central Park", etc.
      
      Choose 3-4 specific activities that fit within the average budget of ${budgets.reduce((a, b) => a + b, 0) / budgets.length} and match the group's mood tags. Each activity should be a specific, real place with a name.
      
      Format the response as JSON with this structure:
      {
        "locations": [
          {
            "name": "Location Name (must be a real, geocodable place)",
            "description": "Brief description of why this location is good for the group",
            "itinerary": ["Specific Activity 1 (e.g., 'Dave & Buster's Arcade')", "Specific Activity 2 (e.g., 'Starbucks Coffee')", "Specific Activity 3 (e.g., 'Central Park')"],
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