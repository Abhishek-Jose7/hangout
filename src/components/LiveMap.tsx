"use client";

import { useEffect, useRef } from 'react';

interface PlaceDetails {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating?: number | null;
  mapsLink?: string;
}

interface LiveMapProps {
  places: PlaceDetails[];
  center?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export default function LiveMap({ places, center, className = "" }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import Leaflet
    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix for default markers in Next.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Calculate center if not provided
        let mapCenter = center;
        if (!mapCenter && places.length > 0) {
          const validPlaces = places.filter(p => p.coordinates);
          if (validPlaces.length > 0) {
            const avgLat = validPlaces.reduce((sum, p) => sum + (p.coordinates?.lat || 0), 0) / validPlaces.length;
            const avgLng = validPlaces.reduce((sum, p) => sum + (p.coordinates?.lng || 0), 0) / validPlaces.length;
            mapCenter = { lat: avgLat, lng: avgLng };
          }
        }

        // Default center (Mumbai) if no valid coordinates
        if (!mapCenter) {
          mapCenter = { lat: 19.0760, lng: 72.8777 };
        }

        // Create map
        const map = L.map(mapRef.current!).setView([mapCenter.lat, mapCenter.lng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add markers for each place
        places.forEach((place) => {
          if (place.coordinates) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const marker = (L as any).marker([place.coordinates.lat, place.coordinates.lng]).addTo(map);
            
            // Create popup content
            let popupContent = `<div style="min-width: 200px;">`;
            popupContent += `<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${place.name}</h3>`;
            popupContent += `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${place.address}</p>`;
            
            if (place.rating) {
              popupContent += `<div style="margin: 0 0 8px 0;">`;
              popupContent += `<span style="color: #fbbf24;">★</span> `;
              popupContent += `<span style="font-weight: 500;">${place.rating}</span>`;
              popupContent += `</div>`;
            }
            
            if (place.mapsLink) {
              popupContent += `<a href="${place.mapsLink}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 14px;">View on Map →</a>`;
            }
            
            popupContent += `</div>`;
            
            marker.bindPopup(popupContent);
          }
        });

        // Fit map to show all markers
        if (places.length > 1) {
          const markers = places
            .filter(p => p.coordinates)
            .map(p => L.marker([p.coordinates!.lat, p.coordinates!.lng]));
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.1));
        }

        mapInstanceRef.current = map;

        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
        };
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [places, center]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border border-gray-200"
        style={{ minHeight: '300px' }}
      />
      {places.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>No places to display on map</p>
          </div>
        </div>
      )}
    </div>
  );
}
