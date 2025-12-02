'use client';

import { useState, useEffect, useCallback } from 'react';

interface FriendsManagerProps {
  onInviteFriend?: (friendId: string) => void;
}

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'accepted' | 'pending_sent' | 'pending_received';
  since?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  createdAt: string;
}

export default function FriendsManager({ onInviteFriend }: FriendsManagerProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/friends');
      const data = await response.json();

      if (data.success) {
        const accepted = (data.friends || []).map((f: Friend) => ({ ...f, status: 'accepted' as const }));
        const pendingSent = (data.pendingSent || []).map((f: Friend) => ({ ...f, status: 'pending_sent' as const }));
        setFriends([...accepted, ...pendingSent]);
        setPendingRequests(data.pendingReceived || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const sendFriendRequest = async (userId?: string, email?: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, action: 'send_request' }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Friend request sent!' });
        setAddEmail('');
        setSearchQuery('');
        setSearchResults([]);
        fetchFriends();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send request' });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setMessage({ type: 'error', text: 'Failed to send request' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: accept ? 'accept' : 'reject' }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: accept ? 'Friend added!' : 'Request declined' });
        fetchFriends();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Friend removed' });
        fetchFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingSent = friends.filter(f => f.status === 'pending_sent');

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Friends</h3>
            <p className="text-cyan-100 text-sm">{acceptedFriends.length} friends</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-2 text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { value: 'friends' as const, label: 'Friends', count: acceptedFriends.length },
          { value: 'requests' as const, label: 'Requests', count: pendingRequests.length },
          { value: 'add' as const, label: 'Add Friend', count: 0 },
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === value
                ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === value ? 'bg-cyan-200' : 'bg-slate-200'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Friends List */}
        {activeTab === 'friends' && (
          <>
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <p className="font-medium text-slate-600">No friends yet</p>
                <p className="text-sm">Add friends to invite them to hangouts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      {friend.avatarUrl ? (
                        <img 
                          src={friend.avatarUrl} 
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{friend.name}</p>
                        <p className="text-xs text-slate-500">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onInviteFriend && (
                        <button
                          onClick={() => onInviteFriend(friend.id)}
                          className="px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700"
                        >
                          Invite
                        </button>
                      )}
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Sent Requests */}
            {pendingSent.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-500 mb-2">Pending Sent</h4>
                <div className="space-y-2">
                  {pendingSent.map((friend) => (
                    <div 
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-yellow-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{friend.name}</p>
                          <p className="text-xs text-yellow-600">Request pending</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Friend Requests */}
        {activeTab === 'requests' && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="font-medium">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {request.fromUserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{request.fromUserName}</p>
                        <p className="text-xs text-slate-500">{request.fromUserEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => respondToRequest(request.id, true)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, false)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-300"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Friend */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            {/* Search Users */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search by name</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter name to search..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {searchResults.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="px-3 py-1 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <p className="text-sm text-slate-500 mt-2">Searching...</p>
              )}
            </div>

            {/* Add by Email */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1">Or add by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={() => sendFriendRequest(undefined, addEmail)}
                  disabled={!addEmail}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
