'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';

type Group = {
  id: string;
  code: string;
  created_at: string;
  memberCount: number;
  userMember: {
    id: string;
    name: string;
    clerk_user_id: string;
  } | null;
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserGroups();
    }
  }, [isLoaded, user]);

  const fetchUserGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/groups');

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setGroups(data.groups || []);
      } else {
        setError(data.error || 'Failed to fetch groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to view your groups.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
              <p className="text-gray-600 mt-1">View and manage all your hangout groups</p>
            </div>
            <Link href="/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Group
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Group {group.code}</h3>
                        <p className="text-sm text-gray-500">
                          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Joined as: <span className="font-medium text-gray-900">{group.userMember?.name || 'Unknown'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Link href={`/group/${group.code}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      View Group
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">Create your first group or join an existing one to get started.</p>
            <Link href="/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Your First Group
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
