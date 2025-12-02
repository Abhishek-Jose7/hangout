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

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      const handleClickOutside = () => setIsMobileMenuOpen(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home', showAlways: true },
    { href: '/dashboard', label: 'My Groups', showWhenLoggedIn: true, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
    { href: '/date', label: 'Date Planner', showWhenLoggedIn: true, special: true, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )},
    { href: '#features', label: 'Features', showAlways: true },
    { href: '#how-it-works', label: 'How It Works', showAlways: true },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'py-3' : 'py-4'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/50 border border-slate-100 rounded-2xl' 
          : ''
      }`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Hangout
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-full p-1">
              {navLinks.map((link) => {
                const shouldShow = link.showAlways || (link.showWhenLoggedIn && isMounted && user);
                if (!shouldShow) return null;
                
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                      link.special 
                        ? 'text-pink-600 hover:bg-pink-50' 
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Authentication Section - Desktop */}
            <div className="hidden md:flex items-center">
              <AuthButtons />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 ${
                isMobileMenuOpen 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 mt-2 mx-4 transition-all duration-300 transform ${
          isMobileMenuOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <div className="p-4 space-y-1">
            {navLinks.map((link) => {
              const shouldShow = link.showAlways || (link.showWhenLoggedIn && isMounted && user);
              if (!shouldShow) return null;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
                    link.special 
                      ? 'text-pink-600 hover:bg-pink-50' 
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={`p-2 rounded-lg ${link.special ? 'bg-pink-100' : 'bg-slate-100'}`}>
                    {link.icon || (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
          
          <div className="border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="flex justify-center">
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
