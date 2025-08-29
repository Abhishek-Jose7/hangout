import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange,
  getRedirectResult,
  auth
} from '@/lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result for mobile devices
    const handleRedirectResult = async () => {
      if (!auth) {
        // Auth isn't initialized (server or misconfigured); skip redirect handling
        return;
      }

      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect sign-in successful:', result.user);
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
      }
    };

    handleRedirectResult();

    if (!auth) {
      // If auth isn't available, there is nothing to subscribe to.
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (): Promise<void> => {
    try {
      await signInWithGoogle();
      // Popup may resolve immediately; redirect will navigate away. No return value needed.
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  isAuthenticated: !!user,
  getIdToken
  };
};
