import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import UserAgent from 'user-agent-array';

// Initialize Gemini for parsing scraped content
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface Place {
    name: string;
    address: string;
    rating: number;
    userRatingsTotal: number;
    types: string[];
    placeId: string;
    description?: string;
    priceLevel?: number;
    sourceUrl?: string;
}

// Free Geocoding using OpenStreetMap (Nominatim)
export async function geocodeLocation(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
    try {
        // Respect Nominatim usage policy (User-Agent required)
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'Hang2App/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon),
                formattedAddress: response.data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

export async function findOptimalMeetingPoint(memberLocations: string[]): Promise<string> {
    try {
        if (memberLocations.length === 0) return 'Mumbai';

        // Geocode all locations
        const coords = await Promise.all(memberLocations.map(loc => geocodeLocation(loc)));
        const validCoords = coords.filter(c => c !== null);

        if (validCoords.length === 0) return memberLocations[0];

        // Calculate centroid
        const avgLat = validCoords.reduce((sum, c) => sum + c!.lat, 0) / validCoords.length;
        const avgLng = validCoords.reduce((sum, c) => sum + c!.lng, 0) / validCoords.length;

        // Reverse geocode the midpoint
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: avgLat,
                lon: avgLng,
                format: 'json'
            },
            headers: {
                'User-Agent': 'Hang2App/1.0'
            }
        });

        if (response.data && response.data.address) {
            const addr = response.data.address;
            // Prefer neighborhood/suburb, then city
            return addr.suburb || addr.neighbourhood || addr.city || addr.town || response.data.display_name;
        }

        return memberLocations[0];
    } catch (error) {
        console.error('Meeting point error:', error);
        return memberLocations[0];
    }
}

// Scrape search results to find "Best X in Y" lists
async function getSearchLinks(query: string): Promise<string[]> {
    try {
        // Use DuckDuckGo HTML version (easier to scrape, less blocking)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const userAgent = new UserAgent();

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': userAgent.toString()
            }
        });

        const $ = cheerio.load(response.data);
        const links: string[] = [];

        // Extract result links
        $('.result__a').each((i, el) => {
            if (i < 3) { // Top 3 results
                const href = $(el).attr('href');
                if (href) links.push(href);
            }
        });

        return links;
    } catch (error) {
        console.error('Search scraping error:', error);
        return [];
    }
}

// Fetch page content and use Gemini to extract places
async function scrapeAndExtractPlaces(url: string, mood: string, location: string): Promise<Place[]> {
    try {
        console.log(`Scraping ${url} for ${mood} places in ${location}...`);
        const userAgent = new UserAgent();

        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent.toString(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            timeout: 10000
        });

        // Clean HTML to reduce token count for Gemini
        const $ = cheerio.load(response.data);
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').substring(0, 15000); // Limit length

        // Use Gemini to parse the unstructured text
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
      I have scraped a webpage about "Best ${mood} places in ${location}".
      Extract a list of specific venues/places mentioned in this text.
      For each place, try to find a rating (out of 5) and review count if mentioned. If not, estimate based on context (e.g. "popular" = 4.5).
      
      Webpage Text:
      ${textContent}

      Return ONLY valid JSON:
      [
        {
          "name": "Place Name",
          "address": "Address or Area (infer from context)",
          "rating": 4.5,
          "reviews": 100,
          "description": "Brief description from text",
          "type": "${mood}"
        }
      ]
      Limit to top 5 places found.
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        let jsonText = text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const places: ScrapedPlace[] = JSON.parse(jsonText);

        return places.map((p) => ({
            name: p.name,
            address: p.address || location,
            rating: p.rating || 4.2,
            userRatingsTotal: p.reviews || 50,
            types: [mood.toLowerCase(), 'point_of_interest'],
            placeId: `scraped_${p.name.replace(/\s+/g, '_')}`,
            description: p.description,
            sourceUrl: url
        }));

    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return [];
    }
}

// Define interface for scraped/AI JSON structure
export interface ScrapedPlace {
    name: string;
    address?: string;
    rating?: number;
    reviews?: number;
    description?: string;
    type?: string;
}

export async function searchPlacesByMood(
    location: string,
    moodTags: string[]
): Promise<Place[]> {
    try {
        const allPlaces: Place[] = [];
        const seenNames = new Set<string>();

        // Pick 2 random mood tags to search for
        const searchMoods = moodTags.sort(() => 0.5 - Math.random()).slice(0, 2);

        for (const mood of searchMoods) {
            const query = `best ${mood} places in ${location} blog review`;
            const links = await getSearchLinks(query);

            // Try scraping the top link
            if (links.length > 0) {
                const places = await scrapeAndExtractPlaces(links[0], mood, location);

                places.forEach(p => {
                    if (!seenNames.has(p.name)) {
                        seenNames.add(p.name);
                        allPlaces.push(p);
                    }
                });
            }
        }

        // If scraping failed, fallback to Gemini generation (simulated scraping)
        if (allPlaces.length === 0) {
            console.log('Scraping yielded no results, using Gemini knowledge base...');
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `
        List 5 real, highly-rated ${moodTags.join(' and ')} places in ${location}.
        Return ONLY valid JSON:
        [
          {
            "name": "Place Name",
            "address": "Area, City",
            "rating": 4.5,
            "reviews": 500,
            "description": "Why it's good",
            "type": "restaurant"
          }
        ]
      `;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            let jsonText = text.trim();
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            const aiPlaces: ScrapedPlace[] = JSON.parse(jsonText);
            return aiPlaces.map((p) => ({
                name: p.name,
                address: p.address || location,
                rating: p.rating || 4.0,
                userRatingsTotal: p.reviews || 100,
                types: [p.type || 'point_of_interest'],
                placeId: `ai_${p.name.replace(/\s+/g, '_')}`,
                description: p.description
            }));
        }

        return allPlaces;
    } catch (error) {
        console.error('Search places error:', error);
        return [];
    }
}

export function categorizePlaces(places: Place[]) {
    const categories: Record<string, Place[]> = {
        dining: [],
        entertainment: [],
        attractions: [],
        shopping: [],
        nightlife: [],
        wellness: [],
    };

    // Categorization based on types or description
    places.forEach(place => {
        const types = place.types || [];
        const desc = (place.description || '').toLowerCase();
        const name = place.name.toLowerCase();

        // Dining
        if (types.includes('restaurant') || types.includes('cafe') || types.includes('food') ||
            desc.includes('food') || desc.includes('eat') || desc.includes('dining') ||
            name.includes('cafe') || name.includes('restaurant') || name.includes('bistro')) {
            categories.dining.push(place);
        }

        // Entertainment
        if (types.includes('movie_theater') || types.includes('bowling_alley') || types.includes('amusement_park') ||
            desc.includes('fun') || desc.includes('game') || desc.includes('movie') || desc.includes('bowling')) {
            categories.entertainment.push(place);
        }

        // Attractions / Culture
        if (types.includes('museum') || types.includes('art_gallery') || types.includes('tourist_attraction') ||
            desc.includes('history') || desc.includes('culture') || desc.includes('art')) {
            categories.attractions.push(place);
        }

        // Shopping
        if (types.includes('shopping_mall') || types.includes('store') ||
            desc.includes('shop') || desc.includes('mall') || desc.includes('market')) {
            categories.shopping.push(place);
        }

        // Nightlife
        if (types.includes('bar') || types.includes('night_club') ||
            desc.includes('drink') || desc.includes('party') || desc.includes('club') || desc.includes('pub')) {
            categories.nightlife.push(place);
        }

        // Wellness / Nature
        if (types.includes('spa') || types.includes('park') || types.includes('gym') ||
            desc.includes('relax') || desc.includes('nature') || desc.includes('walk') || desc.includes('garden')) {
            categories.wellness.push(place);
        }

        // Fallback: Add to attractions if no specific category found but it's a valid place
        if (Object.values(categories).every(cat => !cat.includes(place))) {
            categories.attractions.push(place);
        }
    });

    return categories;
}
