'use client';

import { useState, useEffect, useCallback } from 'react';

interface TravelTimeDisplayProps {
  groupId: string;
  destination?: {
    name: string;
    lat: number;
    lng: number;
  };
}

interface TravelTime {
  memberId: string;
  memberName: string;
  memberLocation: string;
  drivingTime: number | null;
  drivingDistance: number | null;
  transitTime: number | null;
  walkingTime: number | null;
  error?: string;
}

interface Summary {
  averageTravelTime: number;
  maxTravelTime: number;
  minTravelTime: number;
  membersWithData: number;
}

export default function TravelTimeDisplay({ groupId, destination }: TravelTimeDisplayProps) {
  const [travelTimes, setTravelTimes] = useState<TravelTime[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'drive' | 'transit' | 'walk'>('drive');

  const fetchTravelTimes = useCallback(async () => {
    if (!destination) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        groupId,
        lat: destination.lat.toString(),
        lng: destination.lng.toString(),
        name: destination.name,
      });

      const response = await fetch(`/api/travel-times?${params}`);
      const data = await response.json();

      if (data.success) {
        setTravelTimes(data.travelTimes || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching travel times:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, destination]);

  useEffect(() => {
    if (destination) {
      fetchTravelTimes();
    }
  }, [fetchTravelTimes, destination]);

  const getTimeForMode = (tt: TravelTime) => {
    switch (selectedMode) {
      case 'drive': return tt.drivingTime;
      case 'transit': return tt.transitTime;
      case 'walk': return tt.walkingTime;
      default: return tt.drivingTime;
    }
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!destination) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Travel Times</h3>
            <p className="text-orange-100 text-sm truncate max-w-[200px]">to {destination.name}</p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex border-b border-slate-200">
        {[
          { mode: 'drive' as const, icon: '🚗', label: 'Drive' },
          { mode: 'transit' as const, icon: '🚌', label: 'Transit' },
          { mode: 'walk' as const, icon: '🚶', label: 'Walk' },
        ].map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {summary && !isLoading && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200">
          <div className="text-center">
            <p className="text-xl font-bold text-orange-600">{formatTime(summary.minTravelTime)}</p>
            <p className="text-xs text-slate-500">Shortest</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-xl font-bold text-slate-900">{formatTime(summary.averageTravelTime)}</p>
            <p className="text-xs text-slate-500">Average</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{formatTime(summary.maxTravelTime)}</p>
            <p className="text-xs text-slate-500">Longest</p>
          </div>
        </div>
      )}

      {/* Travel Times List */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : travelTimes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No travel time data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {travelTimes
              .sort((a, b) => (getTimeForMode(a) || 999) - (getTimeForMode(b) || 999))
              .map((tt) => {
                const time = getTimeForMode(tt);
                const isLongest = summary && time === summary.maxTravelTime;
                const isShortest = summary && time === summary.minTravelTime;
                
                return (
                  <div 
                    key={tt.memberId} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isShortest ? 'bg-green-50 border border-green-200' :
                      isLongest ? 'bg-red-50 border border-red-200' :
                      'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        isShortest ? 'bg-green-500 text-white' :
                        isLongest ? 'bg-red-500 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {tt.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{tt.memberName}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{tt.memberLocation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tt.error ? (
                        <span className="text-xs text-red-500">{tt.error}</span>
                      ) : (
                        <>
                          <p className={`font-bold ${
                            isShortest ? 'text-green-600' :
                            isLongest ? 'text-red-600' :
                            'text-slate-900'
                          }`}>
                            {formatTime(time)}
                          </p>
                          {selectedMode === 'drive' && tt.drivingDistance && (
                            <p className="text-xs text-slate-500">{tt.drivingDistance} km</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
