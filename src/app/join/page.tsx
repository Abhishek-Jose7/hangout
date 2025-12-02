'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-100/50 to-transparent rounded-full blur-3xl -translate-y-1/4 -translate-x-1/4" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-100/50 to-transparent rounded-full blur-3xl translate-y-1/4 translate-x-1/4" />
      
      <Navbar />

      <div className="relative pt-24 pb-12">
        <div className="container-custom">
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Join Group
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Join a <span className="text-purple-600">Group</span>
              </h1>
              <p className="text-slate-500">
                Enter the 6-character code shared by your friend.
              </p>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
              
              <div className="p-8">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleJoinGroup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                      Enter Group Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      required
                      disabled={isLoading}
                      maxLength={6}
                      className="w-full text-center text-2xl tracking-[0.3em] font-mono font-bold uppercase h-16 
                        bg-slate-50 border-2 border-slate-200 rounded-2xl
                        focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                        transition-all placeholder:text-slate-300
                        disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    {/* Progress indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            code.length > i 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-500 scale-110' 
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-3">
                      {code.length === 6 ? '✓ Ready to join!' : `${6 - code.length} more character${6 - code.length !== 1 ? 's' : ''} needed`}
                    </p>
                  </div>

                  {/* Join Button */}
                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Join Group
                      </>
                    )}
                  </button>
                </form>

                {/* Info Section */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-start gap-3 text-sm text-slate-500">
                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                      The group code is a 6-character alphanumeric code. Ask your friend who created the group for the code.
                    </p>
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
                href="/create" 
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Create new group
                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Quick Tips */}
            <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Quick Tips</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Code is case-insensitive</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Codes don&apos;t expire</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Join multiple groups</p>
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