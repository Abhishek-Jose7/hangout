"use client";
import { useState } from 'react';
import { useAuthContext } from './AuthProvider';

export default function SignInButton() {
  const { user, signIn, signOut } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <button onClick={handleSignOut} disabled={isLoading} className="px-3 py-1 bg-red-600 text-white rounded">
        {isLoading ? 'Signing out...' : 'Sign out'}
      </button>
    );
  }

  return (
    <button onClick={handleSignIn} disabled={isLoading} className="px-3 py-1 bg-blue-600 text-white rounded">
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}
