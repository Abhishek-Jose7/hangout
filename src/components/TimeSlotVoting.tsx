'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface TimeSlotVotingProps {
  groupId: string;
  currentMemberId?: string | null;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  title?: string;
  isRecurring: boolean;
  proposedBy?: { name: string };
}

interface TimeSlotSummary {
  timeSlot: TimeSlot;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  totalResponses: number;
  score: number;
  userVote?: string;
  voters: { name: string; availability: string }[];
}

export default function TimeSlotVoting({ groupId, currentMemberId }: TimeSlotVotingProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlotSummary[]>([]);
  const [bestSlot, setBestSlot] = useState<TimeSlotSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchTimeSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/time-slots?groupId=${groupId}`);
      const data = await response.json();

      if (data.success) {
        setTimeSlots(data.timeSlots || []);
        setBestSlot(data.bestSlot || null);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !startTime || !endTime) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          title: title.trim() || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTitle('');
        setStartDate('');
        setStartTime('');
        setEndTime('');
        setShowAddForm(false);
        fetchTimeSlots();
      }
    } catch (error) {
      console.error('Error adding time slot:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (timeSlotId: string, availability: 'yes' | 'maybe' | 'no') => {
    try {
      await fetch('/api/time-slot-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlotId, availability }),
      });
      fetchTimeSlots();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

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
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">When Works Best?</h3>
              <p className="text-blue-100 text-sm">Doodle-style scheduling</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Time
          </Button>
        </div>
      </div>

      {/* Best Slot Banner */}
      {bestSlot && bestSlot.yesCount >= 2 && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-green-800">
              Best time: {formatDate(bestSlot.timeSlot.startTime)} at {formatTime(bestSlot.timeSlot.startTime)}
              ({bestSlot.yesCount} confirmed)
            </span>
          </div>
        </div>
      )}

      {/* Add Time Slot Form */}
      {showAddForm && (
        <form onSubmit={handleAddTimeSlot} className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name (optional)"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Propose Time
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Time Slots List */}
      <div className="p-4">
        {timeSlots.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No time slots proposed yet</p>
            <p className="text-sm">Add a time that works for you!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeSlots.map((slot) => (
              <div key={slot.timeSlot.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      {slot.timeSlot.title && (
                        <p className="font-semibold text-slate-900">{slot.timeSlot.title}</p>
                      )}
                      <p className="text-sm text-slate-600">
                        {formatDate(slot.timeSlot.startTime)} • {formatTime(slot.timeSlot.startTime)} - {formatTime(slot.timeSlot.endTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-medium">✓ {slot.yesCount}</span>
                      <span className="text-amber-600 font-medium">? {slot.maybeCount}</span>
                      <span className="text-red-600 font-medium">✗ {slot.noCount}</span>
                    </div>
                  </div>
                </div>
                
                {/* Vote Buttons */}
                <div className="p-3 flex gap-2">
                  <button
                    onClick={() => handleVote(slot.timeSlot.id, 'yes')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      slot.userVote === 'yes'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    onClick={() => handleVote(slot.timeSlot.id, 'maybe')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      slot.userVote === 'maybe'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    ? Maybe
                  </button>
                  <button
                    onClick={() => handleVote(slot.timeSlot.id, 'no')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      slot.userVote === 'no'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    ✗ No
                  </button>
                </div>

                {/* Voters */}
                {slot.voters.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {slot.voters.map((voter, i) => (
                        <span 
                          key={i} 
                          className={`text-xs px-2 py-1 rounded-full ${
                            voter.availability === 'yes' ? 'bg-green-100 text-green-700' :
                            voter.availability === 'maybe' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {voter.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
