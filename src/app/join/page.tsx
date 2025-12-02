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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-100/40 to-transparent rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
      
      <Navbar />

      <div className="relative pt-32 pb-20">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join Group
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
                Join a <span className="gradient-text">Group</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                Enter a group code to join friends who are already planning a hangout together.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-purple-500/10 border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {/* Gradient top bar */}
              <div className="h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
              
              <div className="p-8 sm:p-12">
                <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/10">
                    <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Got a code?</h2>
                  <p className="text-slate-600">
                    Ask your friends for the 6-character group code and enter it below to join their hangout planning.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-8 animate-fade-in flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleJoinGroup} className="space-y-8">
                  <div className="max-w-sm mx-auto">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                      Group Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        required
                        disabled={isLoading}
                        maxLength={6}
                        className="w-full text-center text-3xl tracking-[0.3em] font-mono font-bold uppercase h-16 
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
                            className={`w-3 h-3 rounded-full transition-all ${
                              code.length > i 
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-500 scale-110' 
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      type="submit"
                      disabled={isLoading || code.length !== 6}
                      variant="primary"
                      size="lg"
                      className="min-w-[280px] shadow-xl shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      loading={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Join Group
                    </Button>
                    <p className="text-sm text-slate-400 mt-4">
                      {code.length === 6 ? '✓ Ready to join' : `${6 - code.length} more character${6 - code.length !== 1 ? 's' : ''} needed`}
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link 
                href="/" 
                className="inline-flex items-center text-slate-500 hover:text-purple-600 font-medium transition-colors group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <Link 
                href="/create" 
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Create a new group instead
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}