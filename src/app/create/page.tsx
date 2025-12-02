'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/50 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
      
      <Navbar />

      <div className="relative pt-24 pb-12">
        <div className="container-custom">
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Group
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Create a New <span className="text-indigo-600">Group</span>
              </h1>
              <p className="text-slate-500">
                Start planning your hangout. Share the code with friends to join.
              </p>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
              
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <p className="text-center text-slate-600 mb-6">
                  Click below to create a new group. You&apos;ll receive a unique 6-character code that others can use to join.
                </p>
                
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Create Button */}
                <button
                  onClick={handleCreateGroup}
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Group
                    </>
                  )}
                </button>

                {/* Features Row */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-slate-600">Unique Code</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-slate-600">Instant Setup</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-slate-600">Easy Sharing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link 
                href="/" 
                className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <span className="text-slate-300">|</span>
              <Link 
                href="/join" 
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Have a code? Join
                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* How it works section */}
            <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">How it works</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">1</div>
                  <p className="text-sm text-slate-600">Create group & get code</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">2</div>
                  <p className="text-sm text-slate-600">Share code with friends</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">3</div>
                  <p className="text-sm text-slate-600">Plan your hangout!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}