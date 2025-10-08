"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { io, Socket } from 'socket.io-client'; // eslint-disable-line @typescript-eslint/no-unused-vars
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

  // Helper to get current memberId (could be from session, localStorage, etc.)
  const memberId = typeof window !== 'undefined' ? localStorage.getItem('memberId') : null;

  // Voting handler
  const handleVote = async (idx: number) => {
    if (!group?.id || !memberId) return;
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, memberId, itineraryIdx: idx })
    });
    const data = await res.json();
    if (data.success) {
      setVoteCounts(data.voteCounts);
      setFinalisedIdx(data.finalisedIdx);
      setVotedIdx(idx);
    }
  };
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
  const [joinError, setJoinError] = useState<string>('');
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  
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
             localStorage.setItem('memberId', currentUserMember.id);
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
    
  }, [code]);

  // Real-time updates using Socket.io or Supabase real-time
  useEffect(() => {
    if (!group?.id) return;

    if (isSocketAvailable === true && socket) {
      // Use Socket.io for real-time updates
      socket.emit('join-group', group.id);
      const onGroupUpdated = (updatedGroup: Group) => {
        if (updatedGroup.code === code) setGroup(updatedGroup);
      };
      const onMemberJoined = (updatedGroup: Group) => {
        if (updatedGroup.code === code) setGroup(updatedGroup);
      };
      socket.on('group-updated', onGroupUpdated);
      socket.on('member-joined', onMemberJoined);
      
      return () => {
        socket.off('group-updated', onGroupUpdated);
        socket.off('member-joined', onMemberJoined);
      };
    } else if (isSocketAvailable === false) {
      // Use Supabase real-time as fallback
      const handleUpdate = async () => {
        try {
          const response = await fetch(`/api/groups/${code}`);
          const data = await response.json();
          if (data.success && data.group) {
            setGroup(data.group);
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
  }, [socket, group?.id, code, isSocketAvailable]); // Removed subscribeToGroup and unsubscribeFromGroup from dependencies
  
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0) {
      setJoinError('All fields including mood tags are required');
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
      
      // Persist memberId for later voting
      if (typeof window !== 'undefined' && data.member?.id) {
        localStorage.setItem('memberId', data.member.id);
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
           if (!group?.id) return;
           
           try {
             setIsLoadingLocations(true);
             setError(''); // Clear any previous errors
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Group {code}</h1>
                <p className="text-gray-600 mt-1">Share this code with friends to join your hangout</p>
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
          {/* Left Column - Members & Join Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Members Card */}
            <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${styles.animateFadeInUp} ${styles.hoverLift}`}>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
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
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                      disabled={isLoadingLocations}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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

            {/* Join Form Card */}
            <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${styles.animateSlideInRight} ${styles.hoverLift}`}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join this Group
                </h2>
              </div>
              <div className="p-6">
            
                {hasJoined ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl mb-6">
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
                          className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Mood Tags <span className="text-xs text-gray-500">(select at least one)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'Shopping', 'Nightlife'].map(tag => (
                            <button
                              type="button"
                              key={tag}
                              className={`px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                moodTags.includes(tag) 
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600 shadow-lg transform scale-105' 
                                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-300'
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
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                          isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0
                            ? 'opacity-60 cursor-not-allowed bg-gray-400' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
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
          </div>

          {/* Right Column - Itineraries */}
          <div className="lg:col-span-2">
            {/* Empty State */}
            {locations.length === 0 && group?.members && group.members.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Locations?</h3>
                  <p className="text-gray-600 mb-6">Click the &quot;Find Optimal Locations&quot; button to get AI-powered suggestions for your group.</p>
                </div>
              </div>
            )}

            {/* Optimal Locations */}
            {locations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Optimal Meetup Locations
                      </h2>
                      <p className="text-green-100 mt-1">AI-powered suggestions based on your group&apos;s preferences</p>
                    </div>
                    <div className="flex items-center text-green-100 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Shared with all members
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {locations.map((location, index) => (
                      <div key={index} className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${styles.cardEnter} ${
                        finalisedIdx === index 
                          ? 'border-green-500 ring-4 ring-green-200' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}>
                        {/* Finalised Badge */}
                        {finalisedIdx === index && (
                          <div className="absolute -top-3 -right-3 z-10">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-semibold">Finalised Plan</span>
                            </div>
                          </div>
                        )}

                        {/* Header */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{location.name}</h3>
                              <p className="text-gray-600 leading-relaxed">{location.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg">
                                <p className="text-sm font-medium">Estimated Cost</p>
                                <p className="text-xl font-bold">₹{location.estimatedCost.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Vote Section */}
                          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-4">
                              <button
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                  votedIdx === index 
                                    ? 'bg-green-500 text-white cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                                disabled={votedIdx === index}
                                onClick={() => handleVote(index)}
                              >
                                {votedIdx === index ? (
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Voted
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    Vote for this Plan
                                  </div>
                                )}
                              </button>
                              <div className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                                              className="w-20 h-20 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow" 
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}