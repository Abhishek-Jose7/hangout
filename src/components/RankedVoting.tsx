'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface RankedVotingProps {
  groupId: string;
  locations?: { name: string; estimatedCost?: number }[];
  currentMemberId?: string | null;
}

interface VoteResult {
  itineraryIdx: number;
  totalPoints: number;
  firstChoiceVotes: number;
  secondChoiceVotes: number;
  thirdChoiceVotes: number;
}

export default function RankedVoting({ groupId, locations = [], currentMemberId }: RankedVotingProps) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [userVotes, setUserVotes] = useState<{ itineraryIdx: number; rank: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftVotes, setDraftVotes] = useState<Record<number, number>>({});

  const fetchVotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ranked-votes?groupId=${groupId}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        setUserVotes(data.userVotes || []);
        setTotalVoters(data.totalVoters || 0);
        
        // Initialize draft votes from user votes
        const votes: Record<number, number> = {};
        data.userVotes?.forEach((v: { itineraryIdx: number; rank: number }) => {
          votes[v.itineraryIdx] = v.rank;
        });
        setDraftVotes(votes);
      }
    } catch (error) {
      console.error('Error fetching ranked votes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (locations.length > 0) {
      fetchVotes();
    }
  }, [fetchVotes, locations.length]);

  const handleRankChange = (itineraryIdx: number, rank: number) => {
    setDraftVotes(prev => {
      const newVotes = { ...prev };
      
      // Remove any existing vote with this rank
      Object.keys(newVotes).forEach(key => {
        if (newVotes[parseInt(key)] === rank) {
          delete newVotes[parseInt(key)];
        }
      });
      
      // Set new rank or remove if clicking same rank
      if (prev[itineraryIdx] === rank) {
        delete newVotes[itineraryIdx];
      } else {
        newVotes[itineraryIdx] = rank;
      }
      
      return newVotes;
    });
  };

  const handleSubmitVotes = async () => {
    const votes = Object.entries(draftVotes).map(([idx, rank]) => ({
      itineraryIdx: parseInt(idx),
      rank
    }));

    if (votes.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/ranked-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, votes }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
        fetchVotes();
      }
    } catch (error) {
      console.error('Error submitting votes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400 text-yellow-900 border-yellow-500';
      case 2: return 'bg-slate-300 text-slate-800 border-slate-400';
      case 3: return 'bg-amber-600 text-white border-amber-700';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      default: return `${rank}th`;
    }
  };

  if (locations.length === 0) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Ranked Choice Voting</h3>
              <p className="text-violet-100 text-sm">{totalVoters} voter{totalVoters !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {!isEditing && userVotes.length === 0 && (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Vote
            </Button>
          )}
        </div>
      </div>

      {/* Voting Interface */}
      {(isEditing || userVotes.length === 0) && (
        <div className="p-4 bg-violet-50 border-b border-violet-200">
          <p className="text-sm text-violet-700 mb-4">
            Rank your top 3 choices. 1st choice = 5 points, 2nd = 4 points, 3rd = 3 points.
          </p>
          <div className="space-y-3">
            {locations.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center font-bold text-violet-600">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{loc.name}</p>
                    <p className="text-xs text-slate-500">₹{loc.estimatedCost}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => handleRankChange(idx, rank)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border-2 ${
                        draftVotes[idx] === rank
                          ? getRankColor(rank)
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      {getRankLabel(rank)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSubmitVotes}
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={Object.keys(draftVotes).length === 0}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              Submit Votes
            </Button>
            {userVotes.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {!isEditing && userVotes.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Current Rankings</h4>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Change Vote
            </Button>
          </div>
          <div className="space-y-3">
            {results.map((result, index) => {
              const loc = locations[result.itineraryIdx];
              if (!loc) return null;
              
              const maxPoints = results[0]?.totalPoints || 1;
              const percentage = (result.totalPoints / maxPoints) * 100;
              
              return (
                <div key={result.itineraryIdx} className="relative">
                  <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                    index === 0 ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{loc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>🥇 {result.firstChoiceVotes}</span>
                          <span>🥈 {result.secondChoiceVotes}</span>
                          <span>🥉 {result.thirdChoiceVotes}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-violet-600">{result.totalPoints} pts</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Votes Summary */}
      {userVotes.length > 0 && !isEditing && (
        <div className="px-4 pb-4">
          <div className="bg-violet-50 rounded-xl p-3">
            <p className="text-sm font-medium text-violet-700 mb-2">Your Rankings:</p>
            <div className="flex flex-wrap gap-2">
              {userVotes.sort((a, b) => a.rank - b.rank).map((vote) => {
                const loc = locations[vote.itineraryIdx];
                return loc ? (
                  <span key={vote.itineraryIdx} className={`px-3 py-1 rounded-full text-sm font-medium ${getRankColor(vote.rank)}`}>
                    {getRankLabel(vote.rank)}: {loc.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
