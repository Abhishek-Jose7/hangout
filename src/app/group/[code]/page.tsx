'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LiveMap from '@/components/LiveMap';
import { useSocket } from '@/hooks/useSocket';

interface Member {
  id: string;
  name: string;
  location: string;
  budget: number;
  mood_tags: string;
  clerkUserId: string;
  is_admin?: boolean;
}

interface ItineraryDetail {
  address: string;
  rating: number | null;
  photos: string[];
  priceLevel: number | null;
  name: string;
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
}

interface Location {
  name: string;
  description: string;
  itinerary: string[];
  estimatedCost: number;
  itineraryDetails?: ItineraryDetail[];
}

interface Group {
  id: string;
  code: string;
  created_at: string;
  Member: Member[];
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { socket } = useSocket();

  const code = params?.code as string;

  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Member form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const moodOptions = [
    'Cafe Hopping', 'Street Food', 'Fine Dining', 'Bowling/Arcade',
    'Movie Night', 'Nature Walk', 'Shopping Spree', 'Clubbing/Bar',
    'Museum/History', 'Adventure Sports', 'Spa/Relaxation', 'Workshop/Class'
  ];

  // Fetch group data
  const fetchGroup = useCallback(async () => {
    if (!code) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${code}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Group not found');
        return;
      }

      setGroup(data.group);

      // Check if current user is already a member
      if (user?.id && data.group.Member) {
        const member = data.group.Member.find((m: Member) => m.clerkUserId === user.id);
        if (member) {
          setIsMember(true);
          setCurrentMemberId(member.id);
        }
      }
    } catch (err) {
      console.error('Error fetching group:', err);
      setError('Failed to load group');
    } finally {
      setIsLoading(false);
    }
  }, [code, user?.id]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    if (!group?.id) return;

    try {
      setIsLoadingLocations(true);
      const response = await fetch(`/api/locations?groupId=${group.id}`);
      const data = await response.json();

      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [group?.id]);

  // Fetch votes
  const fetchVotes = useCallback(async () => {
    if (!group?.id) return;

    try {
      const response = await fetch(`/api/votes?groupId=${group.id}`);
      const data = await response.json();

      if (data.success) {
        setVoteCounts(data.voteCounts || {});
        if (currentMemberId && data.userVote !== undefined) {
          setUserVote(data.userVote);
        }
      }
    } catch (err) {
      console.error('Error fetching votes:', err);
    }
  }, [group?.id, currentMemberId]);

  useEffect(() => {
    if (isUserLoaded) {
      if (!user) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(`/group/${code}`)}`);
        return;
      }
      fetchGroup();
    }
  }, [isUserLoaded, user, code, router, fetchGroup]);

  // Fetch locations when group is loaded and has members
  useEffect(() => {
    if (group && group.Member && group.Member.length >= 2 && isMember) {
      fetchLocations();
      fetchVotes();
    }
  }, [group, isMember, fetchLocations, fetchVotes]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !code) return;

    socket.emit('join-group', code);

    socket.on('member-joined', (data: { groupCode: string; member: Member }) => {
      if (data.groupCode === code) {
        setGroup(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            Member: [...prev.Member, data.member]
          };
        });
      }
    });

    socket.on('vote-updated', (data: { groupCode: string; voteCounts: Record<number, number> }) => {
      if (data.groupCode === code) {
        setVoteCounts(data.voteCounts);
      }
    });

    socket.on('group-updated', (data: Group) => {
      if (data.code === code) {
        setGroup(data);
      }
    });

    return () => {
      socket.emit('leave-group', code);
      socket.off('member-joined');
      socket.off('vote-updated');
      socket.off('group-updated');
    };
  }, [socket, code]);

  // Pre-fill user name
  useEffect(() => {
    if (user && !name) {
      setName(user.firstName || user.username || '');
    }
  }, [user, name]);

  const handleMoodToggle = (mood: string) => {
    setMoodTags(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !location.trim() || !budget) {
      setError('Please fill in all required fields');
      return;
    }

    if (moodTags.length === 0) {
      setError('Please select at least one mood tag');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          budget: parseFloat(budget),
          groupId: group?.id,
          moodTags: moodTags.join(','),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to join group');
        return;
      }

      setIsMember(true);
      setCurrentMemberId(data.member.id);
      fetchGroup();
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (locationIndex: number) => {
    if (!currentMemberId || !group?.id) return;

    try {
      setIsVoting(true);

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          memberId: currentMemberId,
          itineraryIdx: locationIndex,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserVote(locationIndex);
        setVoteCounts(data.voteCounts || {});
      }
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleGenerateLocations = async () => {
    await fetchLocations();
  };

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/share/${code}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  // Loading state
  if (!isUserLoaded || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-3xl flex items-center justify-center animate-pulse">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading group...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (error && !group) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Group Not Found</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <Button onClick={() => router.push('/')} variant="primary" size="lg">
              Go to Home
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container-custom">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 sm:px-8 py-8 relative overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-sm text-white/90 font-medium">Active Group</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    Group: <span className="font-mono">{code}</span>
                  </h1>
                  <p className="text-indigo-100 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {group?.Member?.length || 0} member{(group?.Member?.length || 0) !== 1 ? 's' : ''} joined
                  </p>
                </div>
                <Button
                  onClick={copyShareLink}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Link
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="px-6 sm:px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Members
                </h2>
                <span className="text-sm text-slate-500">{group?.Member?.length || 0} people</span>
              </div>
              
              {group?.Member && group.Member.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.Member.map((member, index) => (
                    <div
                      key={member.id}
                      className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md animate-fade-in-up ${
                        member.clerkUserId === user?.id
                          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                            {member.name}
                            {member.clerkUserId === user?.id && (
                              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">You</span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {member.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                          ₹{member.budget}
                        </span>
                      </div>
                      {member.mood_tags && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {member.mood_tags.split(',').slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-white text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                              {tag.trim()}
                            </span>
                          ))}
                          {member.mood_tags.split(',').length > 3 && (
                            <span className="text-xs text-slate-400 px-2 py-1">
                              +{member.mood_tags.split(',').length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500">No members yet. Be the first to join!</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Join Form or Status */}
            <div className="lg:col-span-1">
              {!isMember ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sticky top-24">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Join This Group</h2>
                      <p className="text-sm text-slate-500">Fill in your details to join</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleJoinGroup} className="space-y-5">
                    <Input
                      label="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      fullWidth
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      }
                    />

                    <Input
                      label="Your Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Bandra, Mumbai"
                      required
                      fullWidth
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      }
                    />

                    <Input
                      label="Budget (₹)"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g., 1000"
                      required
                      fullWidth
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      }
                    />

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Mood Tags <span className="font-normal text-slate-400">(Select at least one)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {moodOptions.map((mood) => (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => handleMoodToggle(mood)}
                            className={`px-3 py-2 text-sm rounded-xl border-2 transition-all font-medium ${
                              moodTags.includes(mood)
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      size="lg"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Join Group
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-24">
                  {/* Success Header */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">You&apos;re In!</h2>
                    <p className="text-emerald-100 mt-1 text-sm">
                      {(group?.Member?.length || 0) >= 2
                        ? 'Ready to find the perfect hangout spot!'
                        : 'Waiting for more members to join...'}
                    </p>
                  </div>

                  <div className="p-6">
                    {(group?.Member?.length || 0) >= 2 && locations.length === 0 && (
                      <Button
                        onClick={handleGenerateLocations}
                        variant="primary"
                        fullWidth
                        size="lg"
                        loading={isLoadingLocations}
                        className="mb-6"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Find Hangout Spots
                      </Button>
                    )}

                    <div>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share this group
                      </h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${code}`}
                          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-slate-600"
                        />
                        <Button onClick={copyShareLink} size="sm" variant="primary">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Locations & Voting */}
            <div className="lg:col-span-2">
              {isLoadingLocations ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-3xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Finding Perfect Spots...</h3>
                  <p className="text-slate-600 max-w-md mx-auto">Our AI is analyzing everyone&apos;s preferences to find the best hangout locations.</p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : locations.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Recommended Hangout Spots</h2>
                      <p className="text-slate-500 mt-1">Vote for your favorite itinerary</p>
                    </div>
                    <span className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                      {locations.length} options
                    </span>
                  </div>

                  {/* Map */}
                  {locations[selectedLocation ?? 0]?.itineraryDetails && (
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                      <div className="h-64 sm:h-80">
                        <LiveMap
                          places={locations[selectedLocation ?? 0].itineraryDetails?.map(d => ({
                            name: d.name,
                            address: d.address,
                            coordinates: d.coordinates,
                            rating: d.rating,
                            mapsLink: d.mapsLink
                          })) || []}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Cards - Improved Itinerary Presentation */}
                  <div className="space-y-6">
                    {locations.map((loc, index) => {
                      const voteCount = voteCounts[index] || 0;
                      const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
                      const votePercentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                      
                      return (
                        <div
                          key={index}
                          className={`bg-white rounded-3xl shadow-lg border-2 transition-all cursor-pointer overflow-hidden ${
                            selectedLocation === index
                              ? 'border-indigo-500 shadow-xl shadow-indigo-500/10'
                              : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl'
                          }`}
                          onClick={() => setSelectedLocation(index)}
                        >
                          {/* Card Header */}
                          <div className={`p-6 ${selectedLocation === index ? 'bg-gradient-to-br from-indigo-50 to-purple-50' : 'bg-slate-50'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${
                                  selectedLocation === index 
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white text-slate-700 border-2 border-slate-200'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-slate-900">{loc.name}</h3>
                                  <p className="text-slate-600 mt-1">{loc.description}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-3xl font-bold text-indigo-600">₹{loc.estimatedCost}</div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide">estimated</p>
                              </div>
                            </div>
                          </div>

                          {/* Itinerary Timeline */}
                          <div className="p-6 border-t border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              Day Plan
                            </h4>
                            <div className="relative">
                              {/* Timeline line */}
                              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-500 rounded-full" />
                              
                              <div className="space-y-4">
                                {loc.itinerary.map((activity, i) => (
                                  <div key={i} className="relative flex items-start gap-4 pl-4">
                                    {/* Timeline dot */}
                                    <div className="relative z-10 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    </div>
                                    
                                    {/* Activity card */}
                                    <div className="flex-1 bg-slate-50 rounded-xl p-4 hover:bg-indigo-50 transition-colors">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                          Step {i + 1}
                                        </span>
                                      </div>
                                      <p className="text-slate-700 font-medium">{activity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Voting Section */}
                          {isMember && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-semibold text-slate-700">
                                      {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                    </span>
                                    {userVote === index && (
                                      <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Your vote
                                      </span>
                                    )}
                                  </div>
                                  {/* Progress bar */}
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                      style={{ width: `${votePercentage}%` }}
                                    />
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVote(index);
                                  }}
                                  variant={userVote === index ? 'primary' : 'outline'}
                                  loading={isVoting}
                                  disabled={isVoting}
                                >
                                  {userVote === index ? (
                                    <>
                                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Voted
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Vote
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (group?.Member?.length || 0) >= 2 && isMember ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Explore!</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Click the button below to discover the perfect hangout spots based on everyone&apos;s preferences.
                  </p>
                  <Button
                    onClick={handleGenerateLocations}
                    variant="primary"
                    size="lg"
                    loading={isLoadingLocations}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Find Hangout Spots
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Waiting for Members</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Share the group link with your friends. Once at least 2 members join, you can start finding hangout spots!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
