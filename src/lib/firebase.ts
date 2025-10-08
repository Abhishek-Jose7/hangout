import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Firebase configuration - must be provided via NEXT_PUBLIC_* env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required config
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
if (missingFields.length > 0) {
  console.error('Missing Firebase config fields:', missingFields);
}

// Log config for debugging (remove in production)
if (typeof window !== 'undefined') {
  console.log('Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    currentDomain: window.location.hostname,
    configMatch: firebaseConfig.authDomain === window.location.hostname
  });
}

// Initialize Firebase (client-only, single instance)
let app: ReturnType<typeof initializeApp> | undefined;
if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized with domain:', firebaseConfig.authDomain);
    } else {
      app = getApp();
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

const auth = typeof window !== 'undefined' && app ? getAuth(app) : undefined;
const googleProvider = new GoogleAuthProvider();
// Configure Google provider
googleProvider.setCustomParameters({ 
  prompt: 'select_account',
  // Add login_hint if available
  ...(typeof window !== 'undefined' && window.location.hostname && {
    login_hint: window.location.hostname
  })
});

// Ensure durable client-side persistence (no-op on server)
if (typeof window !== 'undefined' && auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence errors; Firebase will fall back to in-memory
  });
}

// Authentication functions
export const signInWithGoogle = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  if (!auth) {
    throw new Error('Firebase auth not initialized. Check your environment variables.');
  }

  try {
    console.log('Attempting Google sign-in with domain:', window.location.hostname);
    // Try popup first for better UX
    await signInWithPopup(auth, googleProvider);
  } catch (popupError: unknown) {
    console.warn('Popup sign-in failed, falling back to redirect:', popupError);
    
    // Check if it's a domain/auth issue
    const error = popupError as { code?: string; message?: string };
    if (error.code === 'auth/unauthorized-domain' || 
        error.code === 'auth/invalid-action' ||
        error.code === 'auth/operation-not-allowed') {
      console.error('Firebase configuration issue detected:', error.code);
      console.error('Current domain:', window.location.hostname);
      console.error('Configured authDomain:', firebaseConfig.authDomain);
      throw new Error(`Authentication failed: ${error.message || 'Unknown error'}. Please check Firebase configuration.`);
    }
    
    // Fallback to redirect for other errors (e.g., popup blocked)
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError: unknown) {
      console.error('Both popup and redirect failed:', redirectError);
      throw redirectError;
    }
  }
}

export const signOutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized. Check your environment variables.');
  }
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase auth not initialized. Auth state changes will not be monitored.');
    return () => {}; // Return empty cleanup function
  }
  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider, getRedirectResult };
