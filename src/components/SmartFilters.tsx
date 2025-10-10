'use client';

import React, { useState } from 'react';

interface SmartFiltersProps {
  onFiltersChange: (filters: {
    sortBy: 'distance' | 'rating' | 'budget' | 'hidden-gems';
    maxDistance?: number;
    minRating?: number;
    maxBudget?: number;
    includeHiddenGems: boolean;
  }) => void;
  memberLocations?: string[];
}

export default function SmartFilters({ onFiltersChange }: SmartFiltersProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'budget' | 'hidden-gems'>('distance');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(3);
  const [maxBudget, setMaxBudget] = useState<number>(1000);
  const [includeHiddenGems, setIncludeHiddenGems] = useState(true);

  const handleFilterChange = () => {
    onFiltersChange({
      sortBy,
      maxDistance,
      minRating,
      maxBudget,
      includeHiddenGems
    });
  };

  // Update filters when any value changes
  React.useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, maxDistance, minRating, maxBudget, includeHiddenGems]);

  const filterOptions = [
    { value: 'distance', label: 'Shortest Travel', icon: '🚶' },
    { value: 'rating', label: 'Highest Rated', icon: '⭐' },
    { value: 'budget', label: 'Budget Friendly', icon: '💰' },
    { value: 'hidden-gems', label: 'Hidden Gems', icon: '💎' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Smart Filters
      </h3>

      <div className="space-y-6">
        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Sort by</label>
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as 'distance' | 'rating' | 'budget' | 'hidden-gems')}
                className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                  sortBy === option.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-center">
                  <span className="text-sm font-medium">{option.icon} {option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Distance: {maxDistance} km
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Rating: {minRating} ⭐
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 ⭐</span>
            <span>5 ⭐</span>
          </div>
        </div>

        {/* Budget Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Budget: ₹{maxBudget}
          </label>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₹100</span>
            <span>₹5000</span>
          </div>
        </div>

        {/* Hidden Gems Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Include Hidden Gems</label>
            <p className="text-xs text-gray-500">Show lesser-known but highly rated spots</p>
          </div>
          <button
            onClick={() => setIncludeHiddenGems(!includeHiddenGems)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              includeHiddenGems ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                includeHiddenGems ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Filter Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <p>Current filters:</p>
            <ul className="mt-1 space-y-1">
              <li>• Sort by: {filterOptions.find(opt => opt.value === sortBy)?.label}</li>
              <li>• Max distance: {maxDistance} km</li>
              <li>• Min rating: {minRating} ⭐</li>
              <li>• Max budget: ₹{maxBudget}</li>
              <li>• Hidden gems: {includeHiddenGems ? 'Included' : 'Excluded'}</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
