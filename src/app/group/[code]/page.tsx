"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { io, Socket } from 'socket.io-client'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { useSocket } from '@/hooks/useSocket';
import { useFetchWithAuth } from '@/lib/fetchWithAuth';
import { useUser } from '@clerk/nextjs';

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
        
        // Check if current user is already a member (authentication handled by API route)
        if (data.group.members && data.group.members.length > 0) {
          // For demo purposes, assume user is member if group has members
          // In production, you'd check the authenticated user's membership
          setHasJoined(true);
          if (data.group.members[0]) {
            localStorage.setItem('memberId', data.group.members[0].id);
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

  // Join socket room and subscribe to updates when connected/group ready
  useEffect(() => {
    if (!socket || !group?.id || !isSocketAvailable) return;
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
  }, [socket, group?.id, code, isSocketAvailable]);

  // Polling fallback for when Socket.io is not available
  useEffect(() => {
    if (isSocketAvailable === false && group?.id) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/groups/${code}`);
          const data = await response.json();
          if (data.success && data.group) {
            setGroup(data.group);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isSocketAvailable, group?.id, code]);
  
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
        throw new Error(`Server error: ${response.status}`);
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
      
      // Refresh group data
      const groupResponse = await fetch(`/api/groups/${code}`);
      const groupData = await groupResponse.json();
      
      if (groupData.success) {
  setGroup(groupData.group);
  setHasJoined(true);
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
      const response = await fetch(`/api/locations?groupId=${group.id}`);
      const data = await response.json();
      if (!data.success || !data.locations) {
        setError(data.error || 'Failed to find optimal locations');
        setLocations([]);
        return;
      }
      setLocations(data.locations || []);
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
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">Group: {code}</h1>
            <p className="text-gray-500 text-sm mt-1">Share this code with others to join</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-2 border-blue-300 hover:bg-blue-50">
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Members List */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Members ({group?.members.length || 0})</h2>
            
            {group?.members && group.members.length > 0 ? (
              <div className="border rounded-md overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{member.budget.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 bg-gray-50 p-4 rounded-md border">No members have joined yet.</p>
            )}
            
            {group?.members && group.members.length >= 2 && (
              <div className="mt-6">
                <Button 
                  onClick={findOptimalLocations}
                  disabled={isLoadingLocations}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoadingLocations ? 'Finding Locations...' : 'Find Optimal Meetup Locations'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Join Form */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Join this Group</h2>
            
            {hasJoined ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                You have joined the group. Personal info will not be shown again.
              </div>
            ) : (
              <>
                {joinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {joinError}
                  </div>
                )}
                {joinSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                    Successfully joined the group!
                  </div>
                )}
                <form onSubmit={handleJoinGroup} className="space-y-4">
                  <Input
                    label="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (use &apos; for apostrophe)"
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
                  <Input
                    label="Your Budget (in ₹)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter your budget in Indian Rupees"
                    fullWidth
                    required
                    disabled={isJoining}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mood Tags <span className="text-xs text-gray-500">(select at least one)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'Shopping', 'Nightlife'].map(tag => (
                        <button
                          type="button"
                          key={tag}
                          className={`px-3 py-1 rounded-full border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${moodTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                          onClick={() => {
                            if (!isJoining) {
                              setMoodTags(moodTags.includes(tag) ? moodTags.filter(t => t !== tag) : [...moodTags, tag]);
                            }
                          }}
                          disabled={isJoining}
                          aria-pressed={moodTags.includes(tag)}
                        >
                          {tag}
                          {moodTags.includes(tag) && <span className="ml-2 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    fullWidth 
                    disabled={isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0}
                    className={`${isJoining || !name.trim() || !location.trim() || !budget.trim() || moodTags.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isJoining ? 'Joining...' : 'Join Group'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Optimal Locations */}
      {locations.length > 0 && (
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-8 border border-green-100">
          <h2 className="text-2xl font-semibold mb-6 text-green-700">Optimal Meetup Locations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location, index) => (
              <div key={index} className={`border rounded-lg p-5 bg-gray-50 shadow-sm hover:shadow-md transition-shadow ${finalisedIdx === index ? 'border-4 border-green-500' : ''}`}> 
                <h3 className="text-xl font-medium mb-2 text-blue-700">{location.name} {finalisedIdx === index && <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded">Finalised Plan</span>}</h3>
                <p className="text-gray-600 mb-4">{location.description}</p>
                
                <h4 className="font-medium mb-2 text-gray-700">Suggested Itinerary:</h4>
                <div className="mb-2">
                  <button
                    className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow ${votedIdx === index ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={votedIdx === index}
                    onClick={() => handleVote(index)}
                  >
                    {votedIdx === index ? 'Voted' : 'Vote for this Plan'}
                  </button>
                  <span className="ml-4 text-sm text-gray-700">Votes: {voteCounts[index] || 0}</span>
                </div>
                <div className="mb-4 space-y-4">
                  {(location.itineraryDetails || []).map((item: ItineraryDetail, i: number) => (
                    <div key={i} className="border rounded-md p-3 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-blue-700 mb-1">{item.name}</h5>
                          <p className="text-gray-600 mb-1">{item.address}</p>
                          {item.rating !== null && (
                            <p className="text-yellow-600 mb-1">Rating: {item.rating} ⭐</p>
                          )}
                          {item.priceLevel !== null && (
                            <p className="text-green-700 mb-1">Price Level: {'₹'.repeat(item.priceLevel ?? 0)}</p>
                          )}
                        </div>
                                                 {item.photos && item.photos.length > 0 && (
                           <div className="flex gap-2 mt-2 md:mt-0">
                             {item.photos.map((photoUrl: string, idx: number) => (
                               <Image key={idx} src={photoUrl} alt="Place photo" width={96} height={96} className="w-24 h-24 object-cover rounded" />
                             ))}
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-medium text-green-700 text-lg">
                  Estimated Cost: <span className="font-bold">₹{location.estimatedCost.toFixed(2)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}