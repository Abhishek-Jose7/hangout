"use client";

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
import styles from './page.module.css';

type ItineraryDetail = {
  name: string;
  address: string;
  rating: number | null;
  photos: string[];
  priceLevel: number | null;
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
  // Authentication is handled by Clerk middleware in API routes
  const fetchWithAuth = useFetchWithAuth();

  // Helper to get current memberId and manage user session
  const [memberId, setMemberId] = useState<string | null>(null);

  // Get the group code from params
  const params = useParams();
  const code = params?.code ? String(params.code) : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to restore session from localStorage
      const storedSession = localStorage.getItem('userSession');
      const storedMemberId = localStorage.getItem('memberId');

      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          // Only restore if it's for the current group
          if (session.groupCode === code) {
            setMemberId(session.memberId);
            setHasJoined(true);
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
        }
      } else if (storedMemberId) {
        // Fallback to old method for backward compatibility
        setMemberId(storedMemberId);
      }
    }
  }, [code]);

  // Voting handler
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

        // Check if all members have voted (consensus reached)
        const totalMembers = group.members.length;
        const totalVotes = Object.values(data.voteCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);

        console.log('Vote cast successfully:', data, `Total members: ${totalMembers}, Total votes: ${totalVotes}`);

        // Only show as finalized if ALL members have voted (consensus)
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
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [isGeneratingLocations, setIsGeneratingLocations] = useState<boolean>(false);
  
  // Fetch group data
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
        setGroup(data.group);
        
        // Check if current user is already a member
          if (data.group.members && data.group.members.length > 0 && user?.id) {
            const currentUserMember = data.group.members.find((member: Member) => member.clerkUserId === user.id);
            if (currentUserMember) {
            setHasJoined(true);
              setMemberId(currentUserMember.id);

              // Store session for this group
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

  // Real-time updates using Socket.io or Supabase real-time
  useEffect(() => {
    if (!group?.id) return;

    if (isSocketAvailable === true && socket) {
      // Use Socket.io for real-time updates
    socket.emit('join-group', group.id);
      
    const onGroupUpdated = (updatedGroup: Group) => {
        if (updatedGroup.code === code) {
          setGroup(updatedGroup);
          // Update vote counts and finalized index from group data
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
          // Member join will be handled by group-updated event
        }
      };

      const onVoteUpdated = (data: { groupCode: string; voteCounts: Record<string, number>; finalisedIdx: number }) => {
        if (data.groupCode === code) {
          setVoteCounts(data.voteCounts);
          setFinalisedIdx(data.finalisedIdx);
          
          // Show notification for vote updates
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
      // Use Supabase real-time as fallback
      const handleUpdate = async () => {
        try {
          const response = await fetch(`/api/groups/${code}`);
          const data = await response.json();
          if (data.success && data.group) {
            setGroup(data.group);
            // Update vote counts and finalized index from group data
            if (data.group.voteCounts) {
              setVoteCounts(data.group.voteCounts);
            }
            if (data.group.finalisedIdx !== undefined) {
              setFinalisedIdx(data.group.finalisedIdx);
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

  // Function to get user location and calculate distances
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

          // Calculate distances for all locations if we have locations
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
          maximumAge: 300000 // 5 minutes
        }
      );
    } catch (error) {
      console.error('Error getting location and distances:', error);
      setJoinError('Error accessing your location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
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
      
      console.log("Joining group with data:", {
        name: name.trim(),
        location: location.trim(),
        budget: parseFloat(budget),
        moodTags,
        groupId: group.id,
      });

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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to join group');
      }
      
      // Persist memberId and session for later voting
      if (typeof window !== 'undefined' && data.member?.id) {
        localStorage.setItem('memberId', data.member.id);
        setMemberId(data.member.id);

        // Store session for this group
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
      
             // Refresh group data to show the new member
             try {
      const groupResponse = await fetch(`/api/groups/${code}`);
      const groupData = await groupResponse.json();
      
      if (groupData.success) {
  setGroup(groupData.group);
               }
             } catch (refreshError) {
               console.error('Error refreshing group data:', refreshError);
               // Don't show error to user, the join was successful
      }
      
      // Clear form
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
             setError(''); // Clear any previous errors
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

             // Show success message if locations were generated (not cached)
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
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100 text-center">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2.5"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-8 border border-red-200 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link href="/">
            <Button>
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
          <div>
                <h1 className="text-3xl font-bold text-gray-900">Group {code}</h1>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 mt-1">Share this code with friends to join your hangout</p>
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
                    variant="outline"
                    className="text-xs px-3 py-1"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share Link
                  </Button>
                </div>
                <div className="mt-2">
                  <RealtimeStatus groupId={group?.id} />
                </div>
              </div>
          </div>
            <div className="flex items-center space-x-3">
          <Link href="/">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
              Back to Home
            </Button>
          </Link>
            </div>
          </div>
        </div>
        </div>
        
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Members */}
          <div className="lg:col-span-1 space-y-6">
            {/* Members Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${styles.animateFadeInUp}`}>
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Members ({group?.members.length || 0})
                </h2>
              </div>
              <div className="p-6">
            {group?.members && group.members.length > 0 ? (
                  <div className="space-y-4">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">₹{member.budget.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
              </div>
            ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No members have joined yet</p>
                  </div>
            )}
            
            {group?.members && group.members.length >= 2 && (
                  <div className="mt-6 space-y-3">
                <Button 
                  onClick={findOptimalLocations}
                      disabled={isLoadingLocations || isGeneratingLocations}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {isLoadingLocations ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Finding Locations...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Find Optimal Locations
                        </div>
                      )}
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
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 rounded-xl"
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
          <div className="lg:col-span-2 space-y-6">
            {/* Join Form Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${styles.animateSlideInRight}`}>
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join this Group
                </h2>
              </div>
              <div className="p-6">

                {hasJoined ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">Successfully joined!</p>
                        <p className="text-sm text-green-600">You can now vote on locations and participate in group decisions.</p>
              </div>
              </div>
              </div>
            ) : (
              <>
                {joinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                    {joinError}
                        </div>
                  </div>
                )}
                {joinSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                    Successfully joined the group!
                        </div>
                  </div>
                )}
                    <form onSubmit={handleJoinGroup} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                    fullWidth
                    required
                    disabled={isJoining}
                          className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State or Address"
                    fullWidth
                    required
                    disabled={isJoining}
                          className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Budget (in ₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                          placeholder="Enter your budget"
                    fullWidth
                    required
                    disabled={isJoining}
                          className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                      </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Mood Tags <span className="text-xs text-gray-500">(select at least one)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                      {['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'Shopping', 'Nightlife'].map(tag => (
                        <button
                          type="button"
                          key={tag}
                              className={`px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                moodTags.includes(tag)
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                              }`}
                          onClick={() => {
                            if (!isJoining) {
                              setMoodTags(moodTags.includes(tag) ? moodTags.filter(t => t !== tag) : [...moodTags, tag]);
                            }
                          }}
                          disabled={isJoining}
                          aria-pressed={moodTags.includes(tag)}
                        >
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium">{tag}</span>
                          {moodTags.includes(tag) && <span className="ml-2 text-xs">✓</span>}
                              </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    fullWidth 
                    disabled={isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0}
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                          isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0
                            ? 'opacity-60 cursor-not-allowed bg-gray-400'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                        }`}
                      >
                        {isJoining ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Joining...
                          </div>
                        ) : (
                          'Join Group'
                        )}
                  </Button>
                </form>
              </>
            )}
          </div>
            </div>

            {/* Itineraries Section */}
            {locations.length === 0 && group?.members && group.members.length >= 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Locations?</h3>
                  <p className="text-gray-600 mb-6">Click the &ldquo;Find Optimal Locations&rdquo; button to get AI-powered suggestions for your group.</p>
                </div>
              </div>
            )}

            {/* Optimal Locations - Show only winning itinerary when decided */}
            {locations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {finalisedIdx !== null ? 'Final Meetup Location' : 'Vote for Meetup Locations'}
                      </h2>
                      <p className="text-blue-100 mt-1">
                        {finalisedIdx !== null
                          ? 'The group has decided on this location!'
                          : 'AI-powered suggestions based on your group\'s preferences'
                        }
                      </p>
                    </div>
                    <div className="flex items-center text-blue-100 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Shared with all members
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  {/* Check if all members have voted for consensus */}
                  {(() => {
                    const totalMembers = group?.members?.length || 0;
                    const totalVotes = Object.values(voteCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);
                    const hasConsensus = totalVotes >= totalMembers && finalisedIdx !== null;

                    return hasConsensus ? (
                      /* Show only the winning itinerary when ALL have voted */
                      <div className="max-w-2xl mx-auto">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 text-center mb-8">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-green-800 mb-2">Location Decided!</h3>
                          <p className="text-green-600">
                            All members have voted! The group has chosen <span className="font-semibold">{locations[finalisedIdx]?.name}</span> as the meetup location.
                          </p>
                        </div>

                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                          <h3 className="text-xl font-bold text-white">{locations[finalisedIdx]?.name}</h3>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600 mb-6 leading-relaxed">{locations[finalisedIdx]?.description}</p>

                          <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Meetup Itinerary
                            </h4>
                            <div className="space-y-4">
                              {(locations[finalisedIdx]?.itineraryDetails || []).map((item: ItineraryDetail, i: number) => (
                                <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {i + 1}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h5>
                                      <p className="text-gray-600 mb-3">{item.address}</p>

                                      <div className="flex flex-wrap items-center gap-4 mb-3">
                                        {item.rating !== null && (
                                          <div className="flex items-center text-yellow-600">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-sm font-medium">{item.rating}</span>
                                          </div>
                                        )}
                                        {item.priceLevel !== null && (
                                          <div className="flex items-center text-green-600">
                                            <span className="text-sm font-medium">
                                              Price: {'₹'.repeat(item.priceLevel ?? 0)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {item.photos && item.photos.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                          {item.photos.slice(0, 3).map((photoUrl: string, idx: number) => (
                                            <div key={idx} className="relative">
                                              <Image
                                                src={photoUrl}
                                                alt="Place photo"
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                              />
                                              {idx === 2 && item.photos.length > 3 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                                  <span className="text-white text-xs font-semibold">+{item.photos.length - 3}</span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
        </div>
      </div>
      
                          {/* Location and Distance Info */}
                          <div className="mt-6 space-y-3">
                            {!userLocation && (
                              <button
                                onClick={getLocationAndDistances}
                                disabled={isGettingLocation}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                {isGettingLocation ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                                {isGettingLocation ? 'Getting Location...' : 'Show Distance from You'}
                              </button>
                            )}

                            {userLocation && distances[locations[finalisedIdx]?.name] && (
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-center space-x-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-green-800 font-semibold">
                                    {distances[locations[finalisedIdx]?.name]?.toFixed(1)} km from your location
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Interactive Map */}
                            {userLocation && (
                              <div className="mt-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                  Interactive Map & Directions
                                </h4>
                                <InteractiveMap
                                  location={locations[finalisedIdx]?.name || ''}
                                  userLocation={userLocation}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-full">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="text-green-800 font-semibold">
                                Total Cost: ₹{locations[finalisedIdx]?.estimatedCost.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                      /* Show all itineraries for voting when consensus not reached */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {locations.map((location, index) => (
                        <div key={index} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
                          {/* Header */}
                          <div className="p-6 pb-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                                <p className="text-gray-600 leading-relaxed">{location.description}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-sm">
                                  <p className="text-sm font-medium">Cost</p>
                                  <p className="text-lg font-bold">₹{location.estimatedCost.toFixed(0)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Vote Section */}
                            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-4">
                  <button
                                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                                    votedIdx === index
                                      ? 'bg-green-500 text-white cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                                  }`}
                    disabled={votedIdx === index}
                    onClick={() => handleVote(index)}
                  >
                                  {votedIdx === index ? (
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Voted
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                      </svg>
                                      Vote
                                    </div>
                                  )}
                  </button>
                                <div className="flex items-center text-gray-600">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span className="font-semibold">{voteCounts[index] || 0} votes</span>
                                </div>
                              </div>
                            </div>
                </div>

                          {/* Itinerary Items */}
                          <div className="px-6 pb-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Suggested Itinerary
                            </h4>
                            <div className="space-y-4">
                  {(location.itineraryDetails || []).map((item: ItineraryDetail, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {i + 1}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h5>
                                      <p className="text-gray-600 mb-3">{item.address}</p>

                                      <div className="flex flex-wrap items-center gap-4 mb-3">
                          {item.rating !== null && (
                                          <div className="flex items-center text-yellow-600">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-sm font-medium">{item.rating}</span>
                                          </div>
                          )}
                          {item.priceLevel !== null && (
                                          <div className="flex items-center text-green-600">
                                            <span className="text-sm font-medium">
                                              Price: {'₹'.repeat(item.priceLevel ?? 0)}
                                            </span>
                                          </div>
                          )}
                        </div>

                                                 {item.photos && item.photos.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                          {item.photos.slice(0, 3).map((photoUrl: string, idx: number) => (
                                            <div key={idx} className="relative">
                                              <Image
                                                src={photoUrl}
                                                alt="Place photo"
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                              />
                                              {idx === 2 && item.photos.length > 3 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                                  <span className="text-white text-xs font-semibold">+{item.photos.length - 3}</span>
                                                </div>
                                              )}
                                            </div>
                             ))}
                           </div>
                         )}
                      </div>
                    </div>
              </div>
            ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                  })()}
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </main>
  );
}