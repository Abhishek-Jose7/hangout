"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import LiveMap from '@/components/LiveMap';

type PlaceDetails = {
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
};

type Activity = {
  name: string;
  description: string;
  duration: string;
  cost: string;
  placeDetails?: PlaceDetails;
};

type Itinerary = {
  name: string;
  description: string;
  activities: Activity[];
  totalCost: number;
  reasoning: string;
};

type DuoDate = {
  id: string;
  created_by: string;
  location: string;
  budget: number;
  time_period: string;
  mood_tags: string[];
  date_type: string;
  itineraries: Itinerary[];
  created_at: string;
};

export default function SharedDuoDatePage() {
  const params = useParams();
  const shareCode = params?.code as string;

  const [duoDate, setDuoDate] = useState<DuoDate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedItinerary, setSelectedItinerary] = useState<number | null>(null);

  useEffect(() => {
    const fetchDuoDate = async () => {
      try {
        const response = await fetch(`/api/duo-date/share?code=${shareCode}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load duo date');
          return;
        }

        setDuoDate(data.duoDate);
      } catch {
        setError('Failed to load duo date');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareCode) {
      fetchDuoDate();
    }
  }, [shareCode]);

  const handleItinerarySelect = (index: number) => {
    setSelectedItinerary(selectedItinerary === index ? null : index);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading duo date...</p>
        </div>
      </main>
    );
  }

  if (error || !duoDate) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Duo Date Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The duo date you\'re looking for doesn\'t exist or has been removed.'}</p>
          <Link href="/duo-date">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
              Create New Duo Date
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Hangout</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/duo-date">
                <Button variant="outline" size="sm">
                  Create New Date
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Duo Date Info */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Shared Duo Date</h1>
            <p className="text-pink-100">Perfect date ideas for you and your special someone</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">{duoDate.location}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget</h3>
                <p className="text-gray-600">₹{duoDate.budget}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Period</h3>
                <p className="text-gray-600 capitalize">{duoDate.time_period.replace('-', ' ')}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Date Type</h3>
                <p className="text-gray-600 capitalize">{duoDate.date_type}</p>
              </div>
            </div>
            {duoDate.mood_tags && duoDate.mood_tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {duoDate.mood_tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Map */}
        {duoDate.itineraries && duoDate.itineraries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Live Map View
              </h2>
            </div>
            <div className="p-6">
              <LiveMap
                places={duoDate.itineraries.flatMap(itinerary =>
                  itinerary.activities
                    .filter(activity => activity.placeDetails?.coordinates)
                    .map(activity => ({
                      name: activity.placeDetails!.name,
                      address: activity.placeDetails!.address,
                      coordinates: activity.placeDetails!.coordinates,
                      rating: activity.placeDetails!.rating,
                      mapsLink: activity.placeDetails!.mapsLink
                    }))
                )}
                className="h-96"
              />
            </div>
          </div>
        )}

        {/* Itineraries */}
        {duoDate.itineraries && duoDate.itineraries.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-pink-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Perfect Date Itineraries
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {duoDate.itineraries.map((itinerary, index) => (
                    <div key={index} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{itinerary.name}</h3>
                            <p className="text-gray-600 leading-relaxed">{itinerary.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 rounded-lg shadow-sm">
                              <p className="text-sm font-medium">Total Cost</p>
                              <p className="text-lg font-bold">₹{itinerary.totalCost}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleItinerarySelect(index)}
                          className="w-full p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 hover:from-pink-100 hover:to-purple-100 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">
                              {selectedItinerary === index ? 'Hide Activities' : 'View Activities & Reasoning'}
                            </span>
                            <svg
                              className={`w-5 h-5 text-pink-600 transition-transform duration-200 ${selectedItinerary === index ? 'rotate-180' : ''
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {selectedItinerary === index && (
                          <div className="mt-6 space-y-6">
                            {/* Activities */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                <svg className="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Activities
                              </h4>
                              <div className="space-y-4">
                                {itinerary.activities.map((activity: Activity, i: number) => (
                                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start space-x-4">
                                      <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                          {i + 1}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{activity.name}</h5>
                                        <p className="text-gray-600 mb-3">{activity.description}</p>

                                        {/* Place Details */}
                                        {activity.placeDetails && (
                                          <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h6 className="font-semibold text-gray-800">{activity.placeDetails.name}</h6>
                                                <p className="text-sm text-gray-600">{activity.placeDetails.address}</p>
                                              </div>
                                              {activity.placeDetails.rating && (
                                                <div className="flex items-center text-yellow-600 ml-2">
                                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                  </svg>
                                                  <span className="text-sm font-medium">{activity.placeDetails.rating}</span>
                                                  {activity.placeDetails.userRatingsTotal > 0 && (
                                                    <span className="text-xs text-gray-500 ml-1">({activity.placeDetails.userRatingsTotal})</span>
                                                  )}
                                                </div>
                                              )}
                                            </div>

                                            {activity.placeDetails.photos && activity.placeDetails.photos.length > 0 && (
                                              <div className="flex gap-2 mb-2">
                                                {activity.placeDetails.photos.slice(0, 2).map((photoUrl: string, idx: number) => (
                                                  <div key={idx} className="relative w-16 h-16">
                                                    <Image
                                                      src={photoUrl}
                                                      alt="Place photo"
                                                      fill
                                                      className="object-cover rounded-lg"
                                                      sizes="64px"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {activity.placeDetails.mapsLink && (
                                              <a
                                                href={activity.placeDetails.mapsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                              >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                View on Google Maps
                                              </a>
                                            )}
                                          </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4">
                                          <div className="flex items-center text-blue-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-medium">{activity.duration}</span>
                                          </div>
                                          <div className="flex items-center text-green-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            <span className="text-sm font-medium">{activity.cost}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Reasoning */}
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
                                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Why This Itinerary?
                              </h4>
                              <p className="text-gray-700 leading-relaxed">{itinerary.reasoning}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
