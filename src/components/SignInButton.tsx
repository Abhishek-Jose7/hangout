"use client";
import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export default function SignInButton() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  if (user) {
    return (
      <button onClick={handleSignOut} className="px-3 py-1 bg-red-600 text-white rounded">Sign out</button>
    );
  }

  return (
    <button onClick={handleSignIn} className="px-3 py-1 bg-blue-600 text-white rounded">Sign in with Google</button>
  );
}
