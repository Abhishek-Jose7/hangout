'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { io, Socket } from 'socket.io-client'; // eslint-disable-line @typescript-eslint/no-unused-vars
import InteractiveMap from '@/components/InteractiveMap';
import { useSocket } from '@/hooks/useSocket';
import { useRealtime } from '@/hooks/useRealtime';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useFetchWithAuth } from '@/lib/fetchWithAuth';
import { useUser } from '@clerk/nextjs';

type ItineraryDetail = {
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
};

type Member = {
  id: string;
  name: string;
  location: string;
  budget: number;
  moodTags: string[];
  clerkUserId?: string;
  email?: string;
};

type Group = {
  id: string;
  code: string;
  members: Member[];
  voteCounts?: Record<string, number>;
  finalisedIdx?: number | null;
  locations?: Array<{
    name: string;
    description: string;
    activities: string[];
    estimatedCost: number;
  }>;
};

type Location = {
  name: string;
  description: string;
  itinerary: string[];
  estimatedCost: number;
  itineraryDetails?: ItineraryDetail[];
};

export default function GroupPage() {
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [finalisedIdx, setFinalisedIdx] = useState<number | null>(null);
  const [votedIdx, setVotedIdx] = useState<number | null>(null);
  const { socket, isSocketAvailable } = useSocket();
  const { subscribeToGroup, unsubscribeFromGroup } = useRealtime();
  const { user } = useUser();
  const fetchWithAuth = useFetchWithAuth();

  const [memberId, setMemberId] = useState<string | null>(null);
  const params = useParams();
  const code = params?.code ? String(params.code) : '';

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [isGeneratingLocations, setIsGeneratingLocations] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('userSession');
      const storedMemberId = localStorage.getItem('memberId');

      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session.groupCode === code) {
            setMemberId(session.memberId);
            setHasJoined(true);
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
        }
      } else if (storedMemberId) {
        setMemberId(storedMemberId);
      }
    }
  }, [code]);

  const handleVote = async (idx: number) => {
    if (!group?.id || !memberId) {
      console.error('Cannot vote: missing group ID or member ID');
      return;
    }

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, memberId, itineraryIdx: idx })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setVoteCounts(data.voteCounts);
        setFinalisedIdx(data.finalisedIdx);
        setVotedIdx(idx);

        const totalMembers = group.members.length;
        const totalVotes = Object.values(data.voteCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);

        console.log('Vote cast successfully:', data, `Total members: ${totalMembers}, Total votes: ${totalVotes}`);

        if (totalVotes >= totalMembers && data.finalisedIdx !== null) {
          console.log('All members have voted - showing final itinerary');
        }
      } else {
        console.error('Vote failed:', data.error);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Helper to normalize group data from API/Socket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeGroup = (data: any): Group => {
    if (!data) return data;
    return {
      ...data,
      members: data.members || data.Member || []
    };
  };

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${code}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch group: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch group');
        }

        console.log("Group data fetched:", data.group);
        const normalizedGroup = normalizeGroup(data.group);
        setGroup(normalizedGroup);

        if (normalizedGroup.members && normalizedGroup.members.length > 0 && user?.id) {
          const currentUserMember = normalizedGroup.members.find((member: Member) => member.clerkUserId === user.id);
          if (currentUserMember) {
            setHasJoined(true);
            setMemberId(currentUserMember.id);

            const session = {
              memberId: currentUserMember.id,
              groupCode: code,
              joinedAt: new Date().toISOString()
            };
            localStorage.setItem('userSession', JSON.stringify(session));

            console.log('User is already a member:', currentUserMember);
          }
        }
      } catch (err) {
        console.error('Error fetching group:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
      } finally {
        setIsLoading(false);
      }
    };

    if (code) {
      fetchGroup();
    }

  }, [code, user?.id]);

  useEffect(() => {
    if (!group?.id) return;

    if (isSocketAvailable === true && socket) {
      socket.emit('join-group', group.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onGroupUpdated = (updatedGroupData: any) => {
        const updatedGroup = normalizeGroup(updatedGroupData);
        if (updatedGroup.code === code) {
          setGroup(updatedGroup);
          if (updatedGroup.voteCounts) {
            setVoteCounts(updatedGroup.voteCounts);
          }
          if (updatedGroup.finalisedIdx !== undefined) {
            setFinalisedIdx(updatedGroup.finalisedIdx);
          }
        }
      };

      const onMemberJoined = (data: { groupCode: string; member: { id: string; name: string; location: string; budget: number } }) => {
        if (data.groupCode === code) {
          console.log('New member joined:', data.member.name);
        }
      };

      const onVoteUpdated = (data: { groupCode: string; voteCounts: Record<string, number>; finalisedIdx: number }) => {
        if (data.groupCode === code) {
          setVoteCounts(data.voteCounts);
          setFinalisedIdx(data.finalisedIdx);

          const totalVotes = Object.values(data.voteCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);
          console.log('Vote updated! Total votes:', totalVotes);
        }
      };

      socket.on('group-updated', onGroupUpdated);
      socket.on('member-joined', onMemberJoined);
      socket.on('vote-updated', onVoteUpdated);

      return () => {
        socket.emit('leave-group', group.id);
        socket.off('group-updated', onGroupUpdated);
        socket.off('member-joined', onMemberJoined);
        socket.off('vote-updated', onVoteUpdated);
      };
    } else if (isSocketAvailable === false) {
      const handleUpdate = async () => {
        try {
          const response = await fetch(`/api/groups/${code}`);
          const data = await response.json();
          if (data.success && data.group) {
            const normalizedGroup = normalizeGroup(data.group);
            setGroup(normalizedGroup);
            if (normalizedGroup.voteCounts) {
              setVoteCounts(normalizedGroup.voteCounts);
            }
            if (normalizedGroup.finalisedIdx !== undefined) {
              setFinalisedIdx(normalizedGroup.finalisedIdx);
            }
          }
        } catch (error) {
          console.error('Real-time update error:', error);
        }
      };

      subscribeToGroup(group.id, handleUpdate);

      return () => {
        unsubscribeFromGroup(group.id);
      };
    }
  }, [socket, group?.id, code, isSocketAvailable, subscribeToGroup, unsubscribeFromGroup]);

  const getLocationAndDistances = async () => {
    try {
      setIsGettingLocation(true);

      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        setJoinError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);

          if (locations.length > 0) {
            const distancePromises = locations.map(async (loc) => {
              try {
                const response = await fetch(`/api/geocode?location=${encodeURIComponent(loc.name)}`);
                const data = await response.json();

                if (data.success && data.coordinates) {
                  const distance = calculateDistance(location, data.coordinates);
                  return { locationName: loc.name, distance };
                }
                return null;
              } catch (error) {
                console.error('Error calculating distance for', loc.name, error);
                return null;
              }
            });

            const distanceResults = await Promise.all(distancePromises);
            const distanceMap: Record<string, number> = {};

            distanceResults.forEach(result => {
              if (result && result.distance !== null) {
                distanceMap[result.locationName] = result.distance;
              }
            });

            setDistances(distanceMap);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setJoinError('Could not get your location. Please enter it manually or enable location access.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } catch (error) {
      console.error('Error getting location and distances:', error);
      setJoinError('Error accessing your location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0) {
      setJoinError('Name, location, budget, and mood tags are required');
      return;
    }

    if (!group?.id) {
      setJoinError('Group information not available. Please refresh the page.');
      return;
    }

    try {
      setIsJoining(true);
      setJoinError('');
      setJoinSuccess(false);

      const body = JSON.stringify({
        name: name.trim(),
        location: location.trim(),
        budget: parseFloat(budget),
        moodTags,
        groupId: group.id,
        clerkUserId: user?.id || null,
        email: user?.emailAddresses?.[0]?.emailAddress || null,
      });

      const response = fetchWithAuth
        ? await fetchWithAuth('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        : await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

      if (!response.ok) {
        let errorData;
        let errorMessage = `Server error: ${response.status}`;

        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // Response might not be JSON (e.g., HTML error page)
          const textError = await response.text();
          console.error('Error response text:', textError.substring(0, 500));
        }

        console.error('API Error - Status:', response.status, 'Data:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to join group');
      }

      if (typeof window !== 'undefined' && data.member?.id) {
        localStorage.setItem('memberId', data.member.id);
        setMemberId(data.member.id);

        const session = {
          memberId: data.member.id,
          groupCode: code,
          joinedAt: new Date().toISOString()
        };
        localStorage.setItem('userSession', JSON.stringify(session));
      }

      console.log("Successfully joined group:", data);
      setJoinSuccess(true);
      setHasJoined(true);

      try {
        const groupResponse = await fetch(`/api/groups/${code}`);
        const groupData = await groupResponse.json();

        if (groupData.success) {
          setGroup(groupData.group);
        }
      } catch (refreshError) {
        console.error('Error refreshing group data:', refreshError);
      }

      setName('');
      setLocation('');
      setBudget('');
      setMoodTags([]);
    } catch (err) {
      console.error('Error joining group:', err);
      setJoinError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  const findOptimalLocations = async () => {
    if (!group?.id || isGeneratingLocations) return;

    try {
      setIsLoadingLocations(true);
      setIsGeneratingLocations(true);
      setError('');
      console.log('Starting location generation for group:', group.id);

      const response = await fetch(`/api/locations?groupId=${group.id}`);
      const data = await response.json();

      if (!data.success) {
        if (data.quotaExceeded) {
          setError('AI service quota exceeded. Please try again later or contact support.');
        } else {
          setError(data.error || 'Failed to find optimal locations');
        }
        setLocations([]);
        return;
      }

      if (!data.locations || data.locations.length === 0) {
        setError('No locations found. Please try again.');
        setLocations([]);
        return;
      }

      setLocations(data.locations || []);

      if (!data.cached) {
        console.log('New locations generated for group');
      } else {
        console.log('Using cached locations for group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find optimal locations. Please try again.');
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
      setIsGeneratingLocations(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold mb-4 text-slate-800">Loading Group...</h1>
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2.5"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 border border-red-200 text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6 text-slate-600">{error}</p>
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group {code}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-slate-500 hidden sm:block">Share code to invite friends</p>
                  <Button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/share/${code}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `Join my hangout group!`,
                          text: `Join my hangout group and let's plan something fun together!`,
                          url: shareUrl
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Share link copied to clipboard!');
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
              <RealtimeStatus groupId={group?.id} />
              <Link href="/">
                <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
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
          {/* Left Column - Members (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            {/* Members Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Group Members
                </h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {group?.members?.length || 0}
                </span>
              </div>
              <div className="p-6">
                {group?.members && group.members.length > 0 ? (
                  <div className="space-y-3">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                          <p className="text-xs text-slate-500 truncate flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {member.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                            ₹{member.budget.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No members yet</p>
                  </div>
                )}

                {group?.members && group.members.length >= 2 && (
                  <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
                    <Button
                      onClick={findOptimalLocations}
                      disabled={isLoadingLocations || isGeneratingLocations}
                      variant="gradient"
                      fullWidth
                      loading={isLoadingLocations}
                      className="shadow-lg shadow-indigo-500/20"
                    >
                      {isLoadingLocations ? 'Finding Locations...' : 'Find Optimal Locations'}
                    </Button>

                    {locations.length > 0 && (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/locations/clear?groupId=${group.id}`, { method: 'DELETE' });
                            const data = await response.json();
                            if (data.success) {
                              setLocations([]);
                              console.log('Itineraries cleared');
                            }
                          } catch (err) {
                            console.error('Error clearing itineraries:', err);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Clear Cached Locations
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Join Form and Itineraries */}
          <div className="lg:col-span-8 space-y-8">
            {/* Join Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up delay-100">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join this Group
                </h2>
              </div>
              <div className="p-6 sm:p-8">
                {hasJoined ? (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-5 py-6 rounded-xl flex items-center shadow-sm">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-5 flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">You&apos;re in!</p>
                      <p className="text-sm text-emerald-700">You can now vote on locations and participate in group decisions.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {joinError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{joinError}</span>
                        </div>
                      </div>
                    )}
                    {joinSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Successfully joined the group!</span>
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleJoinGroup} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          fullWidth
                          required
                          disabled={isJoining}
                        />
                        <Input
                          label="Your Location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, State or Address"
                          fullWidth
                          required
                          disabled={isJoining}
                        />
                      </div>

                      <Input
                        label="Your Budget (in ₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="Enter your budget"
                        fullWidth
                        required
                        disabled={isJoining}
                      />

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Mood Tags <span className="text-xs text-slate-500 font-normal ml-1">(select at least one)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'Shopping', 'Nightlife'].map(tag => (
                            <button
                              type="button"
                              key={tag}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${moodTags.includes(tag)
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 transform scale-105'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                              onClick={() => {
                                if (!isJoining) {
                                  setMoodTags(moodTags.includes(tag) ? moodTags.filter(t => t !== tag) : [...moodTags, tag]);
                                }
                              }}
                              disabled={isJoining}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          fullWidth
                          variant="gradient"
                          size="lg"
                          loading={isJoining}
                          disabled={isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0}
                          className="shadow-lg shadow-indigo-500/30"
                        >
                          Join Group
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Itineraries Section */}
            {locations.length === 0 && group?.members && group.members.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-12 text-center animate-fade-in-up delay-200">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Find Locations?</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">Click the &ldquo;Find Optimal Locations&rdquo; button to get AI-powered suggestions tailored to your group&apos;s preferences.</p>
                <Button onClick={findOptimalLocations} variant="outline" className="mx-auto">
                  Find Locations Now
                </Button>
              </div>
            )}

            {/* Optimal Locations - Show only winning itinerary when decided */}
            {locations.length > 0 && (
              <div className="space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white flex items-center">
                          <span className="mr-3 text-3xl">
                            {finalisedIdx !== null ? '🎉' : '🗳️'}
                          </span>
                          {finalisedIdx !== null ? 'It\'s a Match!' : 'Vote for the Best Plan'}
                        </h2>
                        <p className="text-indigo-100 mt-2 text-lg">
                          {finalisedIdx !== null
                            ? 'The group has spoken! Here is your perfect meetup plan.'
                            : 'Review the AI-curated options below and vote for your favorite.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Consensus Logic */}
                  <div className="p-8 bg-slate-50/50">
                    {(() => {
                      const totalMembers = group?.members?.length || 0;
                      const totalVotes = Object.values(voteCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);
                      const hasConsensus = totalVotes >= totalMembers && finalisedIdx !== null;

                      return hasConsensus ? (
                        /* FINAL ITINERARY VIEW */
                        <div className="max-w-4xl mx-auto">
                          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                            {/* Hero Image */}
                            <div className="relative h-64 sm:h-80 bg-slate-200">
                              {locations[finalisedIdx]?.itineraryDetails?.[0]?.photos?.[0] ? (
                                <Image
                                  src={locations[finalisedIdx].itineraryDetails![0].photos[0]}
                                  alt={locations[finalisedIdx].name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                              <div className="absolute bottom-0 left-0 p-8 w-full">
                                <div className="flex justify-between items-end">
                                  <div>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3 backdrop-blur-md">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Winner
                                    </div>
                                    <h3 className="text-4xl font-bold text-white mb-2">{locations[finalisedIdx]?.name}</h3>
                                    <p className="text-slate-300 text-lg max-w-2xl">{locations[finalisedIdx]?.description}</p>
                                  </div>
                                  <div className="text-right hidden sm:block">
                                    <p className="text-slate-400 text-sm uppercase tracking-wider font-medium mb-1">Total Cost</p>
                                    <p className="text-3xl font-bold text-white">₹{locations[finalisedIdx]?.estimatedCost.toFixed(0)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-8">
                              {/* Timeline */}
                              <div className="relative">
                                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-indigo-100"></div>

                                <div className="space-y-10">
                                  {(locations[finalisedIdx]?.itineraryDetails || []).map((item: ItineraryDetail, i: number) => (
                                    <div key={i} className="relative flex gap-8">
                                      {/* Node */}
                                      <div className="flex-shrink-0 z-10">
                                        <div className="w-16 h-16 bg-white border-4 border-indigo-50 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                          <span className="text-xl font-bold text-indigo-600">{i + 1}</span>
                                        </div>
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                          <div>
                                            <h4 className="text-xl font-bold text-slate-900">{item.name}</h4>
                                            <p className="text-slate-500 flex items-center mt-1">
                                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                              </svg>
                                              {item.address}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {item.rating && (
                                              <div className="flex items-center bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-amber-100">
                                                <span className="mr-1">★</span> {item.rating}
                                              </div>
                                            )}
                                            {item.priceLevel && (
                                              <div className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-100">
                                                {'₹'.repeat(item.priceLevel)}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {item.photos && item.photos.length > 0 && (
                                          <div className="flex gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                                            {item.photos.map((photoUrl: string, idx: number) => (
                                              <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-sm group">
                                                <Image
                                                  src={photoUrl}
                                                  alt={item.name}
                                                  fill
                                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                  sizes="128px"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {item.mapsLink && (
                                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                            <a
                                              href={item.mapsLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                              Open in Google Maps
                                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Map Section */}
                              <div className="mt-12 pt-12 border-t border-slate-200">
                                <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                  <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                  </span>
                                  Directions & Map
                                </h4>

                                {!userLocation ? (
                                  <Button
                                    onClick={getLocationAndDistances}
                                    disabled={isGettingLocation}
                                    variant="outline"
                                    className="mb-4"
                                  >
                                    {isGettingLocation ? 'Locating...' : 'Enable Location for Directions'}
                                  </Button>
                                ) : (
                                  distances[locations[finalisedIdx]?.name] && (
                                    <div className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl mb-6 inline-flex items-center font-medium border border-emerald-100">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                      </svg>
                                      {distances[locations[finalisedIdx]?.name]?.toFixed(1)} km away from you
                                    </div>
                                  )
                                )}

                                {userLocation && (
                                  <div className="h-96 rounded-2xl overflow-hidden shadow-md border border-slate-200">
                                    <InteractiveMap
                                      location={locations[finalisedIdx]?.name || ''}
                                      userLocation={userLocation}
                                      className="w-full h-full"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* VOTING VIEW */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {locations.map((location, index) => (
                            <div key={index} className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                              {/* Card Header */}
                              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{location.name}</h3>
                                  <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Cost</span>
                                    <div className="text-lg font-bold text-emerald-600">₹{location.estimatedCost.toFixed(0)}</div>
                                  </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{location.description}</p>
                              </div>

                              {/* Itinerary Preview */}
                              <div className="p-6 flex-1">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                  Includes
                                </h4>
                                <div className="space-y-4">
                                  {(location.itineraryDetails || []).slice(0, 3).map((item: ItineraryDetail, i: number) => (
                                    <div key={i} className="flex items-start">
                                      <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                                        {i + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{item.address}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {(location.itineraryDetails?.length || 0) > 3 && (
                                    <div className="pl-9 text-xs text-slate-500 font-medium">
                                      + {(location.itineraryDetails?.length || 0) - 3} more stops
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Vote Action */}
                              <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center text-slate-700 font-bold">
                                    <div className="flex -space-x-2 mr-3">
                                      {[...Array(Math.min(voteCounts[index] || 0, 3))].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs text-indigo-600">
                                          👍
                                        </div>
                                      ))}
                                      {(voteCounts[index] || 0) > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-bold">
                                          +{(voteCounts[index] || 0) - 3}
                                        </div>
                                      )}
                                    </div>
                                    <span>{voteCounts[index] || 0} Votes</span>
                                  </div>

                                  <Button
                                    onClick={() => handleVote(index)}
                                    disabled={votedIdx === index}
                                    variant={votedIdx === index ? 'outline' : 'primary'}
                                    className={`flex-1 ${votedIdx === index ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'shadow-lg shadow-indigo-500/20'}`}
                                  >
                                    {votedIdx === index ? (
                                      <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Voted
                                      </>
                                    ) : (
                                      'Vote For This'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}