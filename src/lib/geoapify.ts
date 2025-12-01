const GEOAPIFY_API_KEY = "7995485a15804ab1ac4080a06726595f";

export interface PlaceDetails {
  name: string;
  address: string;
  rating: number | null;
  photos: string[];
  priceLevel: number | null;
  placeId: string;
  mapsLink: string;
  reviews: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  userRatingsTotal: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function isGeoapifyHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=test&apiKey=${GEOAPIFY_API_KEY}`);
    return response.ok;
  } catch (error) {
    console.error('Geoapify health check failed:', error);
    return false;
  }
}

export async function searchPlace(placeName: string, location: string): Promise<PlaceDetails> {
  try {
    const queries = [
      `${placeName} ${location}`,
      `${placeName} near ${location}`,
      placeName
    ];

    for (const query of queries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.features || data.features.length === 0) continue;

      const place = data.features[0];
      const properties = place.properties;
      const coordinates = place.geometry?.coordinates;

      // Get additional details using Places API
      let additionalDetails: { rating?: number; priceLevel?: number; userRatingsTotal?: number } = {};
      if (coordinates && coordinates.length >= 2) {
        try {
          const placesUrl = `https://api.geoapify.com/v2/places?categories=catering,entertainment,leisure,shopping&filter=circle:${coordinates[1]},${coordinates[0]},1000&limit=1&apiKey=${GEOAPIFY_API_KEY}`;
          const placesResponse = await fetch(placesUrl);
          if (placesResponse.ok) {
            const placesData = await placesResponse.json();
            if (placesData.features && placesData.features.length > 0) {
              const placeDetails = placesData.features[0].properties;
              additionalDetails = {
                rating: placeDetails.rating || null,
                priceLevel: placeDetails.price_level || null,
                userRatingsTotal: placeDetails.rating_count || 0
              };
            }
          }
        } catch (error) {
          console.error('Error fetching additional place details:', error);
        }
      }

      return {
        name: properties.name || placeName,
        address: properties.formatted || `${placeName}, ${location}`,
        rating: additionalDetails.rating || null,
        photos: [], // Geoapify doesn't provide photos in the free tier
        priceLevel: additionalDetails.priceLevel || null,
        placeId: properties.place_id || '',
        mapsLink: coordinates ? 
          `https://www.openstreetmap.org/?mlat=${coordinates[1]}&mlon=${coordinates[0]}&zoom=15` : 
          `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName + ' ' + location)}`,
        reviews: [], // Geoapify doesn't provide reviews in the free tier
        userRatingsTotal: additionalDetails.userRatingsTotal || 0,
        coordinates: coordinates ? {
          lat: coordinates[1],
          lng: coordinates[0]
        } : undefined
      };
    }
    
    // Fallback if no results found
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
  } catch (error) {
    console.error(`Error searching place '${placeName}':`, error);
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

export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedLocation}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const coordinates = data.features[0].geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;

    return {
      lat: coordinates[1],
      lng: coordinates[0]
    };
  } catch (error) {
    console.error(`Error geocoding location '${location}':`, error);
    return null;
  }
}
