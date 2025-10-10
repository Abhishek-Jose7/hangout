'use client';

import { useEffect, useRef, useState } from 'react';

interface InteractiveMapProps {
  location: string;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

declare global {
  interface Window {
    google: {
      maps: typeof google.maps;
    };
  }
}

export default function InteractiveMap({ location, userLocation, className = "" }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!location || !mapRef.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);

        // Load Google Maps API if not already loaded
        if (!window.google) {
          await loadGoogleMapsAPI();
        }

        // Geocode the location to get coordinates
        const geocodeResponse = await fetch(`/api/geocode?location=${encodeURIComponent(location)}`);
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.success) {
          throw new Error(`Could not find location: ${location}`);
        }

        const locationCoords = geocodeData.coordinates;

        // Create map centered on the location
        const mapOptions = {
          center: locationCoords,
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };

        const mapInstance = new window.google.maps.Map(mapRef.current!, mapOptions);

        // Add marker for the meetup location
        new window.google.maps.Marker({
          position: locationCoords,
          map: mapInstance,
          title: location,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#065F46" stroke-width="3"/>
                <path d="M20 10 L25 20 L20 30 L15 20 Z" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40)
          }
        });

        // Add marker for user's location if available
        if (userLocation) {
          new window.google.maps.Marker({
            position: userLocation,
            map: mapInstance,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="12" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
                  <circle cx="15" cy="15" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15)
            }
          });

          // Draw line between user location and meetup location
          const lineCoordinates = [
            userLocation,
            locationCoords
          ];

          new window.google.maps.Polyline({
            path: lineCoordinates,
            geodesic: true,
            strokeColor: '#10B981',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: mapInstance
          });

          // Fit map to show both markers
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(userLocation);
          bounds.extend(locationCoords);
          mapInstance.fitBounds(bounds);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, [location, userLocation]);

  const loadGoogleMapsAPI = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCseHoECDuGyH1atjLlTWDJBQKhQRI2HWU'}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps API failed to load'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-200"
        style={{ minHeight: '256px' }}
      />
    </div>
  );
}
