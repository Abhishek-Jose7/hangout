"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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

export default function DuoDatePage() {
  const [location, setLocation] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<string>('half-day');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [dateType, setDateType] = useState<string>('romantic');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);

  const [isSharing, setIsSharing] = useState<boolean>(false);

  const dateTypes = [
    { value: 'romantic', label: 'Romantic', icon: '💕', description: 'Intimate and cozy experiences' },
    { value: 'casual', label: 'Casual', icon: '😊', description: 'Fun and relaxed hangout' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️', description: 'Exciting and thrilling activities' }
  ];

  const timePeriods = [
    { value: 'half-day', label: 'Half Day (3-4 hours)', description: 'Perfect for a quick date' },
    { value: 'full-day', label: 'Full Day (6-8 hours)', description: 'A complete day together' },
    { value: 'evening', label: 'Evening (2-3 hours)', description: 'Dinner and activities' }
  ];

  const moodOptions = [
    'Cafe Hopping', 'Street Food', 'Fine Dining', 'Bowling/Arcade', 'Movie Night', 'Nature Walk', 'Shopping Spree', 'Clubbing/Bar', 'Museum/History', 'Adventure Sports', 'Spa/Relaxation', 'Workshop/Class'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim() || !budget.trim() || moodTags.length === 0) {
      setError('Location, budget, and mood tags are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setItineraries([]);


      const response = await fetch('/api/duo-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location.trim(),
          budget: parseFloat(budget),
          timePeriod,
          moodTags,
          dateType
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to find date itineraries');
        setItineraries([]);
        return;
      }

      if (!data.itineraries || data.itineraries.length === 0) {
        setError('No itineraries found. Please try again.');
        setItineraries([]);
        return;
      }

      setItineraries(data.itineraries);
      console.log('Date itineraries generated:', data.itineraries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find date itineraries. Please try again.');
      setItineraries([]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleShare = async () => {
    if (!itineraries.length) return;

    try {
      setIsSharing(true);
      const response = await fetch('/api/duo-date/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          budget: parseFloat(budget),
          timePeriod,
          moodTags,
          dateType,
          itineraries
        })
      });

      const data = await response.json();
      if (data.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        alert('Share link copied to clipboard!');
      } else {
        alert('Failed to create share link');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2.5 rounded-xl shadow-lg shadow-pink-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Duo Date Planner</h1>
                <p className="text-sm text-slate-500 hidden sm:block">Plan the perfect date with your special someone</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Form (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Plan Your Date
                </h2>
              </div>
              <div className="p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Date Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Date Vibe</label>
                    <div className="grid grid-cols-1 gap-2">
                      {dateTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setDateType(type.value)}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center group ${dateType === type.value
                            ? 'bg-pink-50 border-pink-200 shadow-sm ring-1 ring-pink-200'
                            : 'bg-white border-slate-200 hover:border-pink-200 hover:bg-slate-50'
                            }`}
                        >
                          <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">{type.icon}</span>
                          <div>
                            <div className={`font-semibold text-sm ${dateType === type.value ? 'text-pink-900' : 'text-slate-900'}`}>
                              {type.label}
                            </div>
                            <div className="text-xs text-slate-500">{type.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location & Budget */}
                  <div className="space-y-4">
                    <Input
                      label="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Mumbai, Bandra"
                      fullWidth
                      required
                      disabled={isLoading}
                      className="text-sm"
                    />
                    <Input
                      label="Budget (₹)"
                      type="number"
                      min="0"
                      step="100"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g., 5000"
                      fullWidth
                      required
                      disabled={isLoading}
                      className="text-sm"
                    />
                  </div>

                  {/* Time Period */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
                    <select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-xl border-slate-200 text-slate-900 text-sm focus:border-pink-500 focus:ring-pink-500 py-2.5"
                    >
                      {timePeriods.map((period) => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mood Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {moodOptions.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!isLoading) {
                              setMoodTags(
                                moodTags.includes(tag)
                                  ? moodTags.filter(t => t !== tag)
                                  : [...moodTags, tag]
                              );
                            }
                          }}
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${moodTags.includes(tag)
                            ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || !location.trim() || !budget.trim() || moodTags.length === 0}
                    variant="gradient"
                    className="shadow-lg shadow-pink-500/20 from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                    loading={isLoading}
                  >
                    {isLoading ? 'Generating Plan...' : 'Create Date Itinerary'}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-8 space-y-8">
            {itineraries.length === 0 && !isLoading && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center animate-fade-in-up delay-100">
                <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <span className="text-4xl">💑</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Plan?</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Fill in your preferences on the left to get AI-curated date ideas tailored just for you.
                </p>
              </div>
            )}

            {itineraries.length > 0 && (
              <>
                {/* Live Map Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-bold text-slate-900 flex items-center">
                      <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </span>
                      Map View
                    </h2>
                    <Button
                      onClick={handleShare}
                      disabled={isSharing}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {isSharing ? 'Sharing...' : 'Share Plan'}
                    </Button>
                  </div>
                  <div className="h-80 w-full">
                    <LiveMap
                      places={itineraries.flatMap(itinerary =>
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
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Itineraries List */}
                <div className="space-y-8">
                  {itineraries.map((itinerary, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Itinerary Header */}
                      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-1 rounded-full border border-pink-200">
                                Option {index + 1}
                              </span>
                              <h3 className="text-xl font-bold text-slate-900">{itinerary.name}</h3>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                              {itinerary.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-center px-2">
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cost</p>
                              <p className="text-lg font-bold text-emerald-600">₹{itinerary.totalCost}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100"></div>
                            <div className="text-center px-2">
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Items</p>
                              <p className="text-lg font-bold text-indigo-600">{itinerary.activities.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline View */}
                      <div className="p-6 sm:p-8 bg-white">
                        <div className="relative">
                          {/* Vertical Line */}
                          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100"></div>

                          <div className="space-y-8">
                            {itinerary.activities.map((activity, i) => (
                              <div key={i} className="relative flex gap-6">
                                {/* Timeline Node */}
                                <div className="flex-shrink-0 z-10">
                                  <div className="w-12 h-12 bg-white border-2 border-pink-100 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-lg font-bold text-pink-500">{i + 1}</span>
                                  </div>
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-pink-200 transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                    <div>
                                      <h4 className="text-lg font-bold text-slate-900">{activity.name}</h4>
                                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {activity.duration}
                                        </span>
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                          </svg>
                                          {activity.cost}
                                        </span>
                                      </div>
                                    </div>
                                    {activity.placeDetails?.rating && (
                                      <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-amber-400 mr-1">★</span>
                                        <span className="font-bold text-slate-700">{activity.placeDetails.rating}</span>
                                        <span className="text-xs text-slate-400 ml-1">({activity.placeDetails.userRatingsTotal})</span>
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    {activity.description}
                                  </p>

                                  {activity.placeDetails && (
                                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                                      {activity.placeDetails.photos && activity.placeDetails.photos.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                          {activity.placeDetails.photos.slice(0, 3).map((photoUrl, idx) => (
                                            <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                                              <Image
                                                src={photoUrl}
                                                alt={activity.name}
                                                fill
                                                className="object-cover hover:scale-110 transition-transform duration-500"
                                                sizes="96px"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                          <span className="font-medium text-slate-700 block mb-0.5">{activity.placeDetails.name}</span>
                                          {activity.placeDetails.address}
                                        </div>
                                        {activity.placeDetails.mapsLink && (
                                          <a
                                            href={activity.placeDetails.mapsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                                          >
                                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            View Map
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reasoning Footer */}
                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-slate-600 italic">
                            &quot;{itinerary.reasoning}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
