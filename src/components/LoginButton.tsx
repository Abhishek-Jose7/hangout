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
      await signIn();
      onLoginSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
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
