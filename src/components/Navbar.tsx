'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthButtons from './SignInButton';
import { useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'py-4'
          : 'py-6'
        }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-lg border border-white/20 rounded-2xl' : ''}`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-80 transition-opacity">
              Hangout
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <Link href="/" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              {isMounted && user && (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                    My Groups
                  </Link>
                  <Link href="/date" className="text-slate-600 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors">
                    Date Planner
                  </Link>
                </>
              )}
              <Link href="#features" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                How It Works
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-700 hover:text-indigo-600 p-2 rounded-md focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Authentication Section */}
          <div className="hidden md:flex items-center">
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg mt-2 mx-4 rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link
              href="/"
              className="text-slate-700 hover:text-indigo-600 block px-3 py-2 text-base font-medium transition-colors rounded-lg hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isMounted && user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-700 hover:text-indigo-600 block px-3 py-2 text-base font-medium transition-colors rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Groups
                </Link>
                <Link
                  href="/date"
                  className="text-slate-700 hover:text-pink-600 block px-3 py-2 text-base font-medium transition-colors rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Date Planner
                </Link>
              </>
            )}
            <Link
              href="#features"
              className="text-slate-700 hover:text-indigo-600 block px-3 py-2 text-base font-medium transition-colors rounded-lg hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-slate-700 hover:text-indigo-600 block px-3 py-2 text-base font-medium transition-colors rounded-lg hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <div className="pt-4 flex justify-center">
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
