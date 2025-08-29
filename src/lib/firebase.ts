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
  UserCredential,
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

// Initialize Firebase (client-only, single instance)
let app = undefined as unknown as ReturnType<typeof initializeApp>;
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}

const auth = typeof window !== 'undefined' ? getAuth(app) : (undefined as unknown as ReturnType<typeof getAuth>);
const googleProvider = new GoogleAuthProvider();
// Prefer prompt account selection
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Ensure durable client-side persistence (no-op on server)
if (typeof window !== 'undefined' && auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence errors; Firebase will fall back to in-memory
  });
}

// Authentication functions
export const signInWithGoogle = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    // Try popup first for better UX
    await signInWithPopup(auth, googleProvider);
  } catch (popupError) {
    // Fallback to redirect (e.g., popup blocked or on iOS Safari)
    await signInWithRedirect(auth, googleProvider);
  }
}

export const signOutUser = async (): Promise<void> => {
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider, getRedirectResult };
