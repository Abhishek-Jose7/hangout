'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function JoinGroup() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoJoining, setIsAutoJoining] = useState(false);

  // Check for invite link with code parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('code');

    if (inviteCode) {
      setCode(inviteCode.toUpperCase());
      setIsAutoJoining(true);

      // Auto-join after a short delay to show the code was pre-filled
      setTimeout(() => {
        handleJoinGroup({ preventDefault: () => {} } as React.FormEvent);
      }, 1500);
    }
  }, []);
  // Authentication is handled by Clerk middleware

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
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Join a Group
            </h1>
            <p className="text-lg text-gray-600">
              Enter a group code to join friends who are already planning a hangout together.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔗</div>
              <p className="text-gray-600">
                Ask your friends for the 6-character group code and enter it below to join their hangout planning.
              </p>
            </div>

            {isAutoJoining ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-gray-600 mb-2">Auto-joining group...</p>
                <p className="text-sm text-gray-500">Code: {code}</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleJoinGroup} className="space-y-6">
              <Input
                label="Group Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter the 6-character code"
                fullWidth
                required
                disabled={isLoading}
                className="text-center text-lg tracking-wider"
                maxLength={6}
              />

              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl min-w-[200px]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Joining...
                  </div>
                ) : 'Join Group'}
                  </Button>
                </form>
              </>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}