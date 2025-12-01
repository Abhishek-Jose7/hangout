'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';

export default function CreateGroup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create group');
      }

      router.push(`/group/${data.group.code}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
              Create a New Group
            </h1>
            <p className="text-lg text-slate-600">
              Start planning your next hangout by creating a group. Share the unique code with friends to join.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-200 p-8 sm:p-12 animate-fade-in-up delay-100">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                🚀
              </div>
              <p className="text-slate-600 text-lg">
                Click the button below to create a new group. You will receive a unique code that others can use to join your group.
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

            <div className="text-center">
              <Button
                onClick={handleCreateGroup}
                disabled={isLoading}
                variant="gradient"
                size="lg"
                className="min-w-[240px] shadow-lg shadow-indigo-500/30"
                loading={isLoading}
              >
                Create New Group
              </Button>
            </div>

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