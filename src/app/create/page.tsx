'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LoginButton } from '@/components/LoginButton';
import { useAuthContext } from '@/components/AuthProvider';
import { useFetchWithAuth } from '@/lib/fetchWithAuth';

export default function CreateGroup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const fetchWithAuth = useFetchWithAuth();

  const handleCreateGroup = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetchWithAuth('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body but needed for proper POST request
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create group');
      }
      
      // Navigate to the group page with the new group code
      router.push(`/group/${data.group.code}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Create a New Group</h1>
          <LoginButton />
        </div>
        
        {authLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please sign in to create a group</p>
            <LoginButton />
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-8 text-center">
              Click the button below to create a new group. You&apos;ll receive a unique code that others can use to join your group.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleCreateGroup} 
              fullWidth 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-3"
            >
              {isLoading ? 'Creating...' : 'Create New Group'}
            </Button>
          </>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}