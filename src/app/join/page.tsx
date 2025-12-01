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
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Join a Group
            </h1>
            <p className="text-lg text-slate-600">
              Enter a group code to join friends who are already planning a hangout together.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-200 p-8 sm:p-12 animate-fade-in-up delay-100">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                🔗
              </div>
              <p className="text-slate-600 text-lg">
                Ask your friends for the 6-character group code and enter it below to join their hangout planning.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 animate-fade-in">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2 text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinGroup} className="space-y-8">
              <div className="max-w-xs mx-auto">
                <Input
                  label="Group Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: ABC123"
                  fullWidth
                  required
                  disabled={isLoading}
                  className="text-center text-2xl tracking-[0.2em] font-mono uppercase h-14"
                  maxLength={6}
                />
              </div>

              <div className="text-center">
                <Button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  variant="gradient"
                  size="lg"
                  className="min-w-[240px] shadow-lg shadow-indigo-500/30"
                  loading={isLoading}
                >
                  Join Group
                </Button>
              </div>
            </form>

            <div className="mt-10 text-center border-t border-slate-100 pt-8">
              <Link href="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors group">
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}