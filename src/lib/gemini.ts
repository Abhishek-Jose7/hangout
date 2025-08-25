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
      Please find 4-5 optimal centroid meetup locations based on the groups location that are real, geocodable places (cities, towns, or well-known areas) convenient and equally fair for everyone to meet. Use travel time  through trains for each member as a base. Do not suggest vague or fictional places.
      For each location, suggest a brief itinerary of activities that fit within the average budget of ${budgets.reduce((a, b) => a + b, 0) / budgets.length} and match the group's mood tags.
      Format the response as JSON with this structure:
      {
        "locations": [
          {
            "name": "Location Name (must be a real, geocodable place)",
            "description": "Brief description",
            "itinerary": ["Activity 1", "Activity 2", "Activity 3"],
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