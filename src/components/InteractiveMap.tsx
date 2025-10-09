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

        // Create map centered on the location with some zoom out to show clusters
        const mapOptions = {
          center: locationCoords,
          zoom: 13, // Zoomed out to show activity zones
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };

        const mapInstance = new window.google.maps.Map(mapRef.current!, mapOptions);

        // Add cluster circles for activity zones based on location type
        const activityZones = [
          {
            center: { lat: locationCoords.lat + 0.002, lng: locationCoords.lng + 0.002 },
            radius: 200,
            color: '#EF4444', // Red for dining areas
            title: '🍽️ Dining & Food Zone',
            description: 'Multiple restaurants and cafes nearby'
          },
          {
            center: { lat: locationCoords.lat - 0.002, lng: locationCoords.lng - 0.002 },
            radius: 150,
            color: '#8B5CF6', // Purple for entertainment
            title: '🎬 Entertainment Zone',
            description: 'Movies, arcades, and fun activities'
          },
          {
            center: { lat: locationCoords.lat + 0.001, lng: locationCoords.lng - 0.001 },
            radius: 180,
            color: '#10B981', // Green for parks/outdoor
            title: '🌳 Outdoor Activities Zone',
            description: 'Parks, beaches, and outdoor recreation'
          }
        ];

        // Draw activity zone circles
        activityZones.forEach(zone => {
          const circle = new window.google.maps.Circle({
            center: zone.center,
            radius: zone.radius,
            strokeColor: zone.color,
            strokeOpacity: 0.3,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.1,
            map: mapInstance
          });

          // Add info window for zone
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="text-center p-2">
              <strong>${zone.title}</strong><br/>
              <small>${zone.description}</small>
            </div>`
          });

          const zoneMarker = new window.google.maps.Marker({
            position: zone.center,
            map: mapInstance,
            title: zone.title,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="${zone.color}" stroke="white" stroke-width="2"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">📍</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12)
            }
          });

          zoneMarker.addListener('click', () => {
            infoWindow.open(mapInstance, zoneMarker);
          });
        });

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

          // Fit map to show both markers and activity zones
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(userLocation);
          bounds.extend(locationCoords);
          activityZones.forEach(zone => bounds.extend(zone.center));
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
      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Google Maps API load timeout'));
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      script.crossOrigin = 'anonymous';
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
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="text-yellow-800 font-medium">Map temporarily unavailable</span>
            <p className="text-xs text-yellow-700 mt-1">
              Interactive map will load when your connection is restored
            </p>
          </div>
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
