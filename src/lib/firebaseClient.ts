import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function initClientApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig as any);
  }
  return getApp();
}

export function getFirebaseAuth() {
  initClientApp();
  return getAuth();
}

export default initClientApp;
