"use client";

import React from 'react';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

interface LoginButtonProps {
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ className }) => {
    return (
    <div className={`flex gap-2 ${className}`}>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-blue-600 px-4 py-2 rounded-xl font-semibold transition-all duration-200">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      </div>
  );
};
