'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LoginButton } from '@/components/LoginButton';
import { useAuthContext } from '@/components/AuthProvider';

export default function JoinGroup() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a group code');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // First, check if the group exists
      const response = await fetch(`/api/groups/${code.trim()}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Group not found');
      }
      
      // Navigate to the group page
      router.push(`/group/${code.trim()}`);
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Join a Group</h1>
          <LoginButton />
        </div>
        
        {authLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please sign in to join a group</p>
            <LoginButton />
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-8 text-center">
              Enter the group code to join an existing group.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleJoinGroup} className="space-y-6">
          <Input
            label="Group Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter the 6-character code"
            fullWidth
            required
            disabled={isLoading}
          />
          
          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </Button>
                    </form>
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