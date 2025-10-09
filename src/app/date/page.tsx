'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import InteractiveMap from '@/components/InteractiveMap';

type DateLocation = {
  name: string;
  description: string;
  activities: string[];
  estimatedCost: number;
  coordinates?: { lat: number; lng: number };
};

export default function DatePlanner() {
  const { user, isLoaded } = useUser();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DateLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  // Dynamic date locations based on user's location
  const getDateLocationsForUser = (userLocation: { lat: number; lng: number } | null): DateLocation[] => {
    // Default locations if geolocation fails
    const defaultLocations: DateLocation[] = [
      {
        name: "Marine Drive, Mumbai",
        description: "A romantic seaside promenade perfect for evening walks and watching the sunset",
        activities: ["Romantic sunset walk", "Street food stalls", "Photography spots", "Hand-holding walk", "Ice cream date"],
        estimatedCost: 200
      },
      {
        name: "Juhu Beach, Mumbai",
        description: "Famous beach with street food, horse rides, and beautiful Arabian Sea views",
        activities: ["Beach walk", "Street food", "Horse riding", "Sunset viewing", "Romantic picnic"],
        estimatedCost: 300
      },
      {
        name: "Lodhi Garden, Delhi",
        description: "Historic garden with Mughal-era monuments, perfect for a peaceful romantic outing",
        activities: ["Garden walk", "Picnic", "Historical exploration", "Photography", "Hand-in-hand stroll"],
        estimatedCost: 150
      },
      {
        name: "India Gate, Delhi",
        description: "Iconic war memorial with beautiful lawns, ideal for evening strolls",
        activities: ["Monument visit", "Ice cream vendors", "Evening walk", "Photo opportunities", "Romantic conversation"],
        estimatedCost: 100
      }
    ];

    // If user location is available, prioritize nearby locations
    if (userLocation) {
      // Simulate location-based suggestions (in a real app, you'd use reverse geocoding)
      const nearbyLocations: DateLocation[] = [
        {
          name: "Near Your Location",
          description: "Romantic spots near your current location - perfect for a spontaneous date",
          activities: ["Pottery class", "Art workshop", "Cafe date", "Beach walk", "Movie night"],
          estimatedCost: 400
        },
        {
          name: "Local Cultural Center",
          description: "Discover local art, music, and cultural experiences near you",
          activities: ["Art exhibition", "Live music", "Cultural show", "Gallery visit", "Workshop"],
          estimatedCost: 300
        },
        {
          name: "Nearby Park or Garden",
          description: "Peaceful outdoor spaces perfect for romantic picnics and walks",
          activities: ["Picnic setup", "Nature photography", "Bird watching", "Stargazing", "Hand-holding walk"],
          estimatedCost: 100
        }
      ];

      return [...nearbyLocations, ...defaultLocations.slice(0, 3)];
    }

    return defaultLocations;
  };

  const dateLocations = getDateLocationsForUser(userLocation);

  const getUserLocation = async () => {
    try {
      setIsGettingLocation(true);

      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to plan dates.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Romantic Date Planner</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plan the perfect romantic date with curated locations, activities, and interactive maps.
              Find the ideal spot for a memorable evening together. Get directions and discover hidden gems near you.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Date Locations */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-600 to-red-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Choose Your Perfect Date Spot
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {dateLocations.map((location, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedLocation?.name === location.name
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{location.name}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{location.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                            ₹{location.estimatedCost}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Activities:</h4>
                        <div className="flex flex-wrap gap-2">
                          {location.activities.map((activity, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Click to view on map
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map and Location Button */}
          <div className="space-y-6">
            {/* Location Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Find Distance from You
                </h3>

                {!userLocation ? (
                  <Button
                    onClick={getUserLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGettingLocation ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Getting Your Location...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Show My Location on Map
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-medium">Location detected!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your location is marked on the map below
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Map */}
            {selectedLocation && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Interactive Map - {selectedLocation.name}
                  </h3>

                  <InteractiveMap
                    location={selectedLocation.name}
                    userLocation={userLocation || undefined}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Selected Location Details */}
            {selectedLocation && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-600 to-red-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">{selectedLocation.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6 leading-relaxed">{selectedLocation.description}</p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Perfect Date Activities
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedLocation.activities.map((activity, i) => (
                        <div key={i} className="flex items-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-pink-600 font-semibold text-sm">{i + 1}</span>
                          </div>
                          <span className="text-gray-800 font-medium">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center px-6 py-3 bg-pink-100 rounded-full">
                      <svg className="w-5 h-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-pink-800 font-semibold">
                        Estimated Cost: ₹{selectedLocation.estimatedCost}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-8 border border-pink-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Plan Your Perfect Date?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Choose your ideal romantic location, get directions, and make memories that will last forever.
              Our curated date spots are perfect for creating magical moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  View My Groups
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
