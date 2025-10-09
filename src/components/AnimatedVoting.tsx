'use client';

import { useState, useEffect } from 'react';

interface AnimatedVotingProps {
  voteCounts: Record<number, number>;
  onVote: (index: number) => void;
  votedIndex?: number | null;
  disabled?: boolean;
}

export default function AnimatedVoting({ voteCounts, onVote, votedIndex, disabled = false }: AnimatedVotingProps) {
  const [animatedCounts, setAnimatedCounts] = useState<Record<number, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate vote count changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [voteCounts]);

  const maxVotes = Math.max(...Object.values(voteCounts), 0);

  return (
    <div className="space-y-4">
      {Object.entries(voteCounts).map(([index, count]) => {
        const percentage = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
        const isVoted = votedIndex === parseInt(index);

        return (
          <div key={index} className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Option {String.fromCharCode(65 + parseInt(index))}</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold transition-colors duration-200 ${
                  isVoted ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {count} vote{count !== 1 ? 's' : ''}
                </span>
                {isVoted && (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isVoted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Vote button */}
              <button
                onClick={() => onVote(parseInt(index))}
                disabled={disabled || isVoted}
                className={`absolute inset-y-0 left-0 w-full flex items-center justify-center transition-all duration-200 ${
                  isVoted
                    ? 'bg-green-500 hover:bg-green-600'
                    : disabled
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-semibold rounded-full shadow-lg hover:shadow-xl`}
              >
                {isVoted ? (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Voted
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Vote
                  </div>
                )}
              </button>
            </div>

            {/* Floating vote count animation */}
            {isAnimating && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                +1
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
