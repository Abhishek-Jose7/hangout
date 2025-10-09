'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthButtons from './SignInButton';
import { useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Hangout
            </Link>
          </div>

                  {/* Navigation Links */}
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-8">
                      <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        Home
                      </Link>
                      {user && (
                        <>
                          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                            My Groups
                          </Link>
                          <Link href="/date" className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors">
                            Date Planner
                          </Link>
                        </>
                      )}
                      <Link href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        Features
                      </Link>
                      <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        How It Works
                      </Link>
                      <Link href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        Contact
                      </Link>
                    </div>
                  </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex items-center">
            <AuthButtons />
          </div>
        </div>
      </div>

             {/* Mobile menu */}
             {isMobileMenuOpen && (
               <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                 <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                   <Link
                     href="/"
                     className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     Home
                   </Link>
                   {user && (
                     <>
                       <Link
                         href="/dashboard"
                         className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         My Groups
                       </Link>
                       <Link
                         href="/date"
                         className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium transition-colors"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         Date Planner
                       </Link>
                     </>
                   )}
                   <Link
                     href="#features"
                     className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     Features
                   </Link>
                   <Link
                     href="#how-it-works"
                     className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     How It Works
                   </Link>
                   <Link
                     href="#contact"
                     className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     Contact
                   </Link>
                 </div>
               </div>
             )}
    </nav>
  );
}
