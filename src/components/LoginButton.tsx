"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuthContext } from './AuthProvider';
import Button from './ui/Button';

interface LoginButtonProps {
  onLoginSuccess?: () => void;
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onLoginSuccess, className }) => {
  const { signIn, signOut, isAuthenticated, user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Add timeout to prevent stuck loading state
      const timeoutId = setTimeout(() => {
        console.log('Sign-in timeout - redirect should have happened');
        setIsLoading(false);
      }, 3000); // 3 second timeout
      
      await signIn();
      clearTimeout(timeoutId);
      onLoginSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
      // Don't show error for redirect (this is expected behavior)
      if (error instanceof Error && error.message === 'Redirecting to Google sign-in...') {
        // This is expected for redirect, don't show error
        // Keep loading state true since redirect is happening
        return;
      }
      // For other errors, stop loading
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2">
          {user.photoURL && (
            <Image 
              src={user.photoURL} 
              alt="Profile" 
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">{user.displayName || user.email}</span>
        </div>
        <Button 
          onClick={handleSignOut}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleSignIn}
      disabled={isLoading}
      className={`bg-blue-600 hover:bg-blue-700 ${className}`}
    >
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
};
