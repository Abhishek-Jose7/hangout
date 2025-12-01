import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function findOptimalLocations(members: { name: string; location: string; budget: number; moodTags: string[]; preferredDate: string | null }[], isDatePlanner: boolean = false, dateType: string = 'romantic') {
    try {
        const locations = members.map(member => member.location);
        const budgets = members.map(member => member.budget);
        const allMoodTags = members.flatMap(member => member.moodTags ?? []);

        // Only treat as date if explicitly requested through date planner feature
        const isDate = isDatePlanner && members.length === 2;

        const averageBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

        // Check if any member has a preferred date set (for romantic suggestions)
        const hasPreferredDate = members.some(member => member.preferredDate);
        const preferredDateText = hasPreferredDate ? ` (some members have preferred dates set)` : '';

        // Add some randomization to make prompts more dynamic
        const creativeApproaches = [
            "Think like a local food blogger who knows all the hidden gems",
            "Imagine you're a travel writer creating an insider's guide",
            "Channel the energy of a local event planner who specializes in unique experiences",
            "Think like a city explorer who discovers offbeat spots",
            "Imagine you're a social media influencer showcasing local culture"
        ];

        const randomApproach = creativeApproaches[Math.floor(Math.random() * creativeApproaches.length)];

        // Add time-based context for more dynamic suggestions
        const currentHour = new Date().getHours();
        const timeContext = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";
        const seasonContext = new Date().getMonth() < 3 ? "winter" : new Date().getMonth() < 6 ? "spring" : new Date().getMonth() < 9 ? "summer" : "autumn";

        // Create a more dynamic and intelligent prompt
        const prompt = `
${randomApproach}. Your task is to create personalized, creative, and contextually relevant suggestions for ${isDate ? 'a romantic date' : 'a group hangout'}.

GROUP CONTEXT:
- ${members.length} people from: ${locations.join(', ')}
- Individual budgets: ₹${budgets.join(', ₹')} (average: ₹${averageBudget})
- Interests/moods: ${allMoodTags.join(', ')}${preferredDateText}
- ${isDate ? `Date type: ${dateType}` : 'Group hangout'}
- Current time context: ${timeContext} (consider this when suggesting activities)
- Season: ${seasonContext} (factor this into your suggestions)

YOUR MISSION:
Don't just suggest generic places - think about:
1. What makes each location special and unique?
2. What hidden gems or local favorites would surprise and delight this group?
3. How can you create a memorable experience that matches their interests?
4. What's the perfect flow of activities that tells a story?

CREATIVITY GUIDELINES:
- Be spontaneous and creative - avoid cookie-cutter suggestions
- Mix popular spots with hidden gems
- Consider the time of day, season, and local events
- Think about the "vibe" and atmosphere each place offers
- Create experiences that spark conversation and connection
- Consider accessibility and practical logistics
- Think about the emotional journey - what feelings should each activity evoke?
- Consider the group's personality based on their interests and mood tags
- Suggest places that have character, not just functionality

LOCATION REQUIREMENTS:
- Must be real, existing places in India
- Use specific area names (e.g., "Koramangala, Bangalore" not just "Bangalore")
- Consider geographic fairness for all members
- Ensure good connectivity and accessibility
- Stay within budget constraints

ACTIVITY REQUIREMENTS:
- Suggest 3-4 specific, real businesses or landmarks
- Each activity should have a clear purpose and appeal
- Create a logical flow between activities
- Consider walking distance or short travel between spots
- Make each suggestion feel intentional and thoughtful

${isDate ? `
DATE-SPECIFIC THINKING:
For a ${dateType} date, consider:
- What creates intimacy and connection?
- What activities allow for meaningful conversation?
- What experiences will they remember fondly?
- How can you balance excitement with comfort?
- What unique local experiences showcase the city's character?
` : `
GROUP HANGOUT THINKING:
For a group hangout, consider:
- What activities work well for multiple people?
- How can you accommodate different interests?
- What creates shared experiences and bonding?
- What's fun, engaging, and inclusive?
- How can you make everyone feel included?
`}

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "locations": [
    {
      "name": "Specific Area, City (e.g., 'Hauz Khas Village, Delhi')",
      "description": "A compelling, personalized description of why this location is perfect for this specific group - mention unique features, atmosphere, and what makes it special",
      "itinerary": ["Specific Activity at Real Place Name", "Another Activity at Another Real Place", "Final Activity at Third Real Place"],
      "estimatedCost": 800
    }
  ]
}

Remember: Be creative, be local, be personal. Think beyond the obvious and create suggestions that feel tailor-made for this group's interests and budget.
Return ONLY the JSON, nothing else.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini API raw response:', text);

        // Try to extract and validate JSON from the response
        try {
            // Remove markdown code blocks if present
            let jsonText = text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
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
        console.error('Gemini API error:', error);
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

export async function findOptimalDateItineraries(dateData: { location: string; budget: number; timePeriod: string; moodTags: string[]; dateType: string }) {
    try {
        const { location, budget, timePeriod, moodTags, dateType } = dateData;

        const prompt = `You are a romantic date planning expert. Create 2-3 unique, memorable date experiences for a ${dateType} date in ${location}.

DATE CONTEXT:
- Location: ${location}
- Budget: ₹${budget}
- Time: ${timePeriod}
- Date type: ${dateType}
- Interests: ${moodTags.join(', ')}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "itineraries": [
    {
      "name": "Creative, evocative name that captures the vibe",
      "description": "A compelling description of what makes this itinerary special",
      "activities": [
        {
          "name": "Specific activity at real place name",
          "description": "Detailed description of the experience",
          "duration": "X hours",
          "cost": "₹XXX-XXX"
        }
      ],
      "totalCost": 800,
      "reasoning": "Explain the overall philosophy and flow of this itinerary"
    }
  ]
}

Return ONLY the JSON, nothing else.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini API raw response for date itineraries:', text);

        // Try to extract and validate JSON from the response
        try {
            let jsonText = text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!parsed.itineraries || !Array.isArray(parsed.itineraries)) {
                throw new Error('Invalid response structure: missing itineraries array');
            }

            const validatedItineraries = parsed.itineraries
                .filter((itinerary: { name?: string; description?: string; activities?: Array<{ name: string; description: string; duration: string; cost: string }>; totalCost?: number; reasoning?: string }) => {
                    if (!itinerary.name || !itinerary.description || !itinerary.activities || !itinerary.totalCost || !itinerary.reasoning) {
                        console.warn('Skipping invalid itinerary:', itinerary);
                        return false;
                    }

                    if (!Array.isArray(itinerary.activities) || itinerary.activities.length < 3) {
                        console.warn('Skipping itinerary with insufficient activities:', itinerary.name);
                        return false;
                    }

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
        console.error('Gemini API error:', error);
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
}
