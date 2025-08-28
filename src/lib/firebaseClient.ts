import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
} = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function initClientApp() {
  if (!getApps().length) {
    // Only initialize when all required fields are present to avoid runtime errors
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      initializeApp(firebaseConfig);
    } else {
      console.warn('Firebase client not initialized; missing NEXT_PUBLIC_FIREBASE_* env vars');
    }
  }
  return getApp();
}

export function getFirebaseAuth() {
  initClientApp();
  return getAuth();
}

export default initClientApp;
