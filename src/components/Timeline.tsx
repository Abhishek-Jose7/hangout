'use client';

import { useState, useEffect } from 'react';

interface TimelineEvent {
  time: Date;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export default function Timeline({ events, className = "" }: TimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isPast = (eventTime: Date) => {
    return currentTime > eventTime;
  };

  const isCurrent = (eventTime: Date) => {
    const diff = Math.abs(currentTime.getTime() - eventTime.getTime());
    return diff < 60000; // Within 1 minute
  };

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-6">
        {events.map((event, index) => {
          const past = isPast(event.time);
          const current = isCurrent(event.time);

          return (
            <div key={index} className="relative flex items-start">
              {/* Timeline dot */}
              <div className={`relative z-10 w-4 h-4 rounded-full border-4 border-white ${
                current ? 'bg-blue-500 animate-pulse' :
                past ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {/* Pulsing current indicator */}
                {current && (
                  <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                )}
              </div>

              {/* Event content */}
              <div className="ml-6 flex-1 min-w-0">
                <div className={`p-4 rounded-lg border transition-all duration-200 ${
                  current ? 'bg-blue-50 border-blue-200 shadow-md' :
                  past ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{event.icon}</span>
                        <h3 className={`font-semibold ${
                          current ? 'text-blue-800' :
                          past ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </h3>
                      </div>
                      <p className={`text-sm ${
                        current ? 'text-blue-600' :
                        past ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {event.description}
                      </p>
                    </div>

                    <div className="text-right ml-4">
                      <div className={`text-sm font-medium ${
                        current ? 'text-blue-800' :
                        past ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {formatTime(event.time)}
                      </div>
                      <div className={`text-xs ${
                        current ? 'text-blue-600' :
                        past ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {formatDate(event.time)}
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="mt-2 flex items-center space-x-2">
                    {past && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                      </span>
                    )}
                    {current && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                        Happening Now
                      </span>
                    )}
                    {!past && !current && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
