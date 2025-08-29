"use client";

import { useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';

export default function FirebaseConfigTest() {
  const [config, setConfig] = useState<{
    envVars: Record<string, string>;
    currentDomain: string;
    authInitialized: boolean;
    googleProviderConfigured: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check environment variables
      const envVars = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
      };

      setConfig({
        envVars,
        currentDomain: window.location.hostname,
        authInitialized: !!auth,
        googleProviderConfigured: !!googleProvider,
      });
    }
  }, []);

  const testAuth = async () => {
    try {
      setError(null);
      if (!auth) {
        setError('Firebase auth not initialized');
        return;
      }
      
      // Test if we can access auth methods
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser);
      console.log('Auth config:', auth.config);
      
      setError('Auth test successful - check console for details');
    } catch (err: unknown) {
              setError(`Auth test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!config) return <div>Loading config...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-2xl mx-auto mt-4">
      <h3 className="text-lg font-semibold mb-4">Firebase Configuration Test</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Environment Variables:</strong>
          <div className="ml-4 space-y-1">
            {Object.entries(config.envVars).map(([key, value]) => (
              <div key={key} className="text-sm">
                {key}: {value}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <strong>Current Domain:</strong> {config.currentDomain}
        </div>
        
        <div>
          <strong>Auth Initialized:</strong> {config.authInitialized ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Google Provider:</strong> {config.googleProviderConfigured ? '✅ Yes' : '❌ No'}
        </div>
        
        <button
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Auth
        </button>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
