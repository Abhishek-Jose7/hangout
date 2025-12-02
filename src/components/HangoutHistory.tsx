'use client';

import { useState, useEffect, useCallback } from 'react';

interface HangoutHistoryProps {
  groupId?: string;
  userId?: string;
  showReviews?: boolean;
}

interface Hangout {
  id: string;
  groupId: string;
  groupName: string;
  locationName: string;
  locationAddress: string;
  date: string;
  totalCost: number;
  attendeeCount: number;
  rating?: number;
  photos: string[];
  status: 'completed' | 'cancelled';
}

interface HangoutReview {
  id: string;
  hangoutId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
}

export default function HangoutHistory({ groupId, userId, showReviews = true }: HangoutHistoryProps) {
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [reviews, setReviews] = useState<Record<string, HangoutReview[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHangout, setSelectedHangout] = useState<string | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const fetchHangouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (groupId) params.set('groupId', groupId);
      if (userId) params.set('userId', userId);
      params.set('status', 'completed');

      const response = await fetch(`/api/hangouts?${params}`);
      const data = await response.json();

      if (data.success) {
        setHangouts(data.hangouts || []);
      }
    } catch (error) {
      console.error('Error fetching hangouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, userId]);

  const fetchReviews = useCallback(async (hangoutId: string) => {
    try {
      const response = await fetch(`/api/reviews?hangoutId=${hangoutId}`);
      const data = await response.json();

      if (data.success) {
        setReviews(prev => ({
          ...prev,
          [hangoutId]: data.reviews || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, []);

  useEffect(() => {
    fetchHangouts();
  }, [fetchHangouts]);

  useEffect(() => {
    if (selectedHangout && !reviews[selectedHangout]) {
      fetchReviews(selectedHangout);
    }
  }, [selectedHangout, reviews, fetchReviews]);

  const submitReview = async () => {
    if (!selectedHangout) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hangoutId: selectedHangout,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(selectedHangout);
        setNewReview({ rating: 5, comment: '' });
        setShowAddReview(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <svg 
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Hangout History</h3>
            <p className="text-violet-100 text-sm">{hangouts.length} past meetups</p>
          </div>
        </div>
      </div>

      {/* Hangouts List */}
      <div className="p-4">
        {hangouts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-slate-600">No past hangouts yet</p>
            <p className="text-sm">Completed hangouts will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hangouts.map((hangout) => {
              const isExpanded = selectedHangout === hangout.id;
              const hangoutReviews = reviews[hangout.id] || [];
              const avgRating = hangoutReviews.length > 0
                ? hangoutReviews.reduce((sum, r) => sum + r.rating, 0) / hangoutReviews.length
                : hangout.rating || 0;

              return (
                <div key={hangout.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Hangout Card */}
                  <button
                    onClick={() => setSelectedHangout(isExpanded ? null : hangout.id)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{hangout.locationName}</h4>
                          {avgRating > 0 && (
                            <span className="flex items-center gap-1 text-sm text-yellow-600">
                              ⭐ {avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{hangout.locationAddress}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>📅 {formatDate(hangout.date)}</span>
                          <span>👥 {hangout.attendeeCount} attended</span>
                          {hangout.totalCost > 0 && (
                            <span>💰 {formatCurrency(hangout.totalCost)}</span>
                          )}
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && showReviews && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50">
                      <h5 className="font-medium text-slate-900 mb-3">
                        Reviews ({hangoutReviews.length})
                      </h5>

                      {/* Reviews List */}
                      {hangoutReviews.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {hangoutReviews.map((review) => (
                            <div key={review.id} className="bg-white p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium">
                                    {review.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-900">{review.userName}</span>
                                </div>
                                {renderStars(review.rating)}
                              </div>
                              {review.comment && (
                                <p className="text-sm text-slate-600">{review.comment}</p>
                              )}
                              <p className="text-xs text-slate-400 mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mb-4">No reviews yet</p>
                      )}

                      {/* Add Review */}
                      {showAddReview ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                            {renderStars(newReview.rating, true, (r) => setNewReview(prev => ({ ...prev, rating: r })))}
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                            <textarea
                              value={newReview.comment}
                              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                              placeholder="How was the hangout?"
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={submitReview}
                              className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                            >
                              Submit Review
                            </button>
                            <button
                              onClick={() => setShowAddReview(false)}
                              className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddReview(true)}
                          className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-violet-400 hover:text-violet-600"
                        >
                          + Add Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
