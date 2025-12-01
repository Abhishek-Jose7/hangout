// Maps API Health Check Utility
export async function checkMapsApiHealth(apiKey: string): Promise<boolean> {
  try {
    // Test with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Delhi&key=${apiKey}`;
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.log('Maps API health check failed: HTTP error', response.status);
      return false;
    }
    
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      console.log('Maps API health check failed: Request denied - billing not enabled');
      return false;
    }
    
    if (data.status === 'OK') {
      console.log('Maps API health check passed');
      return true;
    }
    
    console.log('Maps API health check failed: Status', data.status);
    return false;
  } catch (error) {
    console.log('Maps API health check failed: Network error', error);
    return false;
  }
}

// Cache the health check result for 5 minutes
let mapsApiHealthy: boolean | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function isMapsApiHealthy(apiKey: string): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if it's still valid
  if (mapsApiHealthy !== null && (now - lastHealthCheck) < HEALTH_CHECK_CACHE_DURATION) {
    return mapsApiHealthy;
  }
  
  // Perform health check
  mapsApiHealthy = await checkMapsApiHealth(apiKey);
  lastHealthCheck = now;
  
  return mapsApiHealthy;
}
