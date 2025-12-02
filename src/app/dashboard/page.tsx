'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import FriendsManager from '@/components/FriendsManager';
import HangoutHistory from '@/components/HangoutHistory';

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
  const [dashboardTab, setDashboardTab] = useState<'groups' | 'friends' | 'history'>('groups');

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Navbar />

      <div className="container-custom py-24 sm:py-32">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">My Groups</h1>
              </div>
              <p className="text-slate-600">
                Manage and view all your group hangouts in one place
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-3">
              <Button
                onClick={() => router.push('/join')}
                variant="outline"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                Join Group
              </Button>
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

        {/* Dashboard Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-8 overflow-hidden">
          <div className="flex">
            {[
              { id: 'groups' as const, label: 'My Groups', icon: '👥' },
              { id: 'friends' as const, label: 'Friends', icon: '🤝' },
              { id: 'history' as const, label: 'History', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  dashboardTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5 animate-fade-in shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {dashboardTab === 'friends' && (
          <div className="max-w-2xl mx-auto">
            <FriendsManager />
          </div>
        )}

        {/* History Tab */}
        {dashboardTab === 'history' && (
          <div className="max-w-3xl mx-auto">
            <HangoutHistory userId={user?.id} showReviews={true} />
          </div>
        )}

        {/* Groups Tab */}
        {dashboardTab === 'groups' && (
          <>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
            <p className="text-slate-600">Loading your groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Groups Yet</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">You haven&apos;t created or joined any groups yet. Start planning your next hangout!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCreateGroup}
                variant="primary"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Group
              </Button>
              <Button
                onClick={() => router.push('/join')}
                variant="outline"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join Existing Group
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="text-3xl font-bold text-slate-900">{groups.length}</div>
                <div className="text-sm text-slate-500">Total Groups</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">{groups.filter(g => g.finalisedIdx !== null && g.finalisedIdx !== undefined).length}</div>
                <div className="text-sm text-slate-500">Decided</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{groups.filter(g => g.voteCounts && Object.values(g.voteCounts).some(count => count > 0) && g.finalisedIdx === null).length}</div>
                <div className="text-sm text-slate-500">Voting</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="text-3xl font-bold text-amber-600">{groups.filter(g => !g.voteCounts || !Object.values(g.voteCounts).some(count => count > 0)).length}</div>
                <div className="text-sm text-slate-500">Planning</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, index) => {
                const status = getGroupStatus(group);
                return (
                  <div
                    key={group.id}
                    className="group bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Status Bar */}
                    <div className={`h-1.5 ${status.status === 'decided' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : status.status === 'voting' ? 'bg-gradient-to-r from-indigo-400 to-violet-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{group.name || `Group ${group.code}`}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                              {group.code}
                            </span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(group.code)}
                              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                              title="Copy code"
                            >
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.color}`}>
                            <span className="mr-1.5">{status.icon}</span>
                            {status.text}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="font-medium">{group.members.length}</span>
                          <span className="text-slate-400 ml-1">member{group.members.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span>{formatDate(group.created_at)}</span>
                        </div>
                        
                        {/* Member Avatars */}
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {group.members.slice(0, 4).map((member, i) => (
                              <div 
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                                style={{ zIndex: 4 - i }}
                                title={member.name}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {group.members.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-bold">
                                +{group.members.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => fetchGroupDetails(group.code)}
                          variant="ghost"
                          size="sm"
                          fullWidth
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Details
                        </Button>
                        <Button
                          onClick={() => handleJoinGroup(group.code)}
                          variant="primary"
                          size="sm"
                          fullWidth
                        >
                          Enter
                          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Group Details Modal */}
        {showGroupDetails && selectedGroup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border border-slate-100">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedGroup.name || `Group ${selectedGroup.code}`}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">View group details and members</p>
                </div>
                <button
                  onClick={() => setShowGroupDetails(false)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Group Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                    <div className="text-sm font-medium text-indigo-600 mb-1">Group Code</div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-mono font-bold text-slate-900">{selectedGroup.code}</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedGroup.code)}
                        className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                    <div className="text-sm font-medium text-emerald-600 mb-1">Total Members</div>
                    <p className="text-2xl font-bold text-slate-900">{selectedGroup.members.length}</p>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Members
                  </h3>
                  <div className="space-y-3">
                    {selectedGroup.members.map((member, index) => (
                      <div 
                        key={member.id} 
                        className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-indigo-500/25">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{member.name}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {member.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              ₹{member.budget}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Finalized Location */}
                {selectedGroup.finalisedIdx !== null && selectedGroup.finalisedIdx !== undefined && selectedGroup.locations && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Decided Location
                    </h3>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-800 text-lg">
                            {selectedGroup.locations[selectedGroup.finalisedIdx]?.name}
                          </p>
                          <p className="text-emerald-600 text-sm mt-1">
                            This location has been finalized by the group
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vote Counts */}
                {selectedGroup.voteCounts && Object.keys(selectedGroup.voteCounts).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Current Votes
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(selectedGroup.voteCounts).map(([itineraryIdx, count]) => {
                        const locationName = selectedGroup.locations?.[Number(itineraryIdx)]?.name || `Option ${Number(itineraryIdx) + 1}`;
                        const maxVotes = Math.max(...Object.values(selectedGroup.voteCounts || {}));
                        const percentage = maxVotes > 0 ? (count / selectedGroup.members.length) * 100 : 0;
                        return (
                          <div key={itineraryIdx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-700 font-medium">{locationName}</span>
                              <span className="font-bold text-indigo-600">{count} vote{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-6 flex gap-4 rounded-b-3xl">
                <Button
                  onClick={() => setShowGroupDetails(false)}
                  variant="ghost"
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
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}