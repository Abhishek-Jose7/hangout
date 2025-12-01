'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';

interface Group {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
  members: Array<{
    id: string;
    name: string;
    location: string;
    budget: number;
    clerk_user_id?: string;
  }>;
  locations?: Array<{
    name: string;
    description: string;
    activities: string[];
    estimatedCost: number;
  }>;
  voteCounts?: Record<number, number>;
  finalisedIdx?: number | null;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  const { socket } = useSocket();

  // Fetch user's groups
  const fetchUserGroups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/groups/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        console.error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load your groups');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Helper to normalize group data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeGroup = (data: any): Group => {
    if (!data) return data;
    return {
      ...data,
      members: data.members || data.Member || []
    };
  };

  // Fetch detailed group data
  const fetchGroupDetails = async (groupCode: string) => {
    try {
      const response = await fetch(`/api/groups/${groupCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedGroup(normalizeGroup(data.group));
          setShowGroupDetails(true);
        }
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  // Subscribe to real-time updates for all groups
  useEffect(() => {
    if (groups.length > 0 && socket) {
      groups.forEach(group => {
        socket.emit('join-group', group.code);
      });

      // Listen for group updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('group-updated', (updatedGroupData: any) => {
        const updatedGroup = normalizeGroup(updatedGroupData);
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        if (selectedGroup?.id === updatedGroup.id) {
          setSelectedGroup(updatedGroup);
        }
      });

      socket.on('member-joined', (data: { groupCode: string; member: { id: string; name: string; location: string; budget: number } }) => {
        setGroups(prev => prev.map(group =>
          group.code === data.groupCode
            ? { ...group, members: [...group.members, data.member] }
            : group
        ));
      });

      socket.on('vote-updated', (data: { groupCode: string; voteCounts: Record<number, number>; finalisedIdx: number }) => {
        setGroups(prev => prev.map(group =>
          group.code === data.groupCode
            ? { ...group, voteCounts: data.voteCounts, finalisedIdx: data.finalisedIdx }
            : group
        ));
        if (selectedGroup?.code === data.groupCode) {
          setSelectedGroup(prev => prev ? { ...prev, voteCounts: data.voteCounts, finalisedIdx: data.finalisedIdx } : null);
        }
      });

      return () => {
        groups.forEach(group => {
          socket.emit('leave-group', group.code);
        });
        socket.off('group-updated');
        socket.off('member-joined');
        socket.off('vote-updated');
      };
    }
  }, [groups, socket, selectedGroup]);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        fetchUserGroups();
      } else {
        router.push('/');
      }
    }
  }, [isLoaded, user, router, fetchUserGroups]);

  const handleJoinGroup = (groupCode: string) => {
    router.push(`/group/${groupCode}`);
  };

  const handleCreateGroup = () => {
    router.push('/create');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGroupStatus = (group: Group) => {
    if (group.finalisedIdx !== null && group.finalisedIdx !== undefined) {
      return {
        status: 'decided',
        text: 'Location Decided',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '✅'
      };
    }
    if (group.voteCounts && Object.values(group.voteCounts).some(count => count > 0)) {
      return {
        status: 'voting',
        text: 'Voting in Progress',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: '🗳️'
      };
    }
    return {
      status: 'planning',
      text: 'Planning Phase',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '📋'
    };
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h1>
            <p className="text-slate-600 mb-6">You need to be signed in to view your groups.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Groups</h1>
              <p className="mt-2 text-slate-600">
                Manage and view all your group hangouts
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={handleCreateGroup}
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Create New Group
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Groups Yet</h3>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">You haven&apos;t created or joined any groups yet. Start planning your next hangout!</p>
            <Button
              onClick={handleCreateGroup}
              variant="primary"
            >
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map((group, index) => {
              const status = getGroupStatus(group);
              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{group.name || `Group ${group.code}`}</h3>
                        <p className="text-sm text-slate-500 mb-3 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded">Code: {group.code}</p>
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                          <span className="mr-1.5">{status.icon}</span>
                          {status.text}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Created {formatDate(group.created_at)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => fetchGroupDetails(group.code)}
                        variant="outline"
                        size="sm"
                        fullWidth
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => handleJoinGroup(group.code)}
                        variant="primary"
                        size="sm"
                        fullWidth
                      >
                        Enter
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group Details Modal */}
        {showGroupDetails && selectedGroup && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedGroup.name || `Group ${selectedGroup.code}`}
                  </h2>
                  <button
                    onClick={() => setShowGroupDetails(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Group Info */}
                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="block font-medium text-slate-500 mb-1">Group Code</span>
                      <p className="text-lg font-mono font-bold text-slate-900">{selectedGroup.code}</p>
                    </div>
                    <div>
                      <span className="block font-medium text-slate-500 mb-1">Total Members</span>
                      <p className="text-lg font-bold text-slate-900">{selectedGroup.members.length}</p>
                    </div>
                  </div>
                </div>

                {/* Members List */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Members</h3>
                  <div className="space-y-3">
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 shadow-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.location} • ₹{member.budget}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Finalized Location */}
                {selectedGroup.finalisedIdx !== null && selectedGroup.finalisedIdx !== undefined && selectedGroup.locations && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Decided Location</h3>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-bold text-emerald-800">Location Decided!</span>
                      </div>
                      <p className="text-emerald-700 ml-9 font-medium">
                        {selectedGroup.locations[selectedGroup.finalisedIdx]?.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vote Counts */}
                {selectedGroup.voteCounts && Object.keys(selectedGroup.voteCounts).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Current Votes</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedGroup.voteCounts).map(([itineraryIdx, count]) => {
                        const locationName = selectedGroup.locations?.[Number(itineraryIdx)]?.name || `Option ${Number(itineraryIdx) + 1}`;
                        return (
                          <div key={itineraryIdx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-700 font-medium">{locationName}</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">{count} vote{count !== 1 ? 's' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <Button
                    onClick={() => setShowGroupDetails(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleJoinGroup(selectedGroup.code)}
                    variant="primary"
                    className="flex-1"
                  >
                    Enter Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}