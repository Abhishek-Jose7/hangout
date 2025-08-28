import admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  // privateKey may contain escaped newlines
  const normalized = privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalized,
    } as any),
  });
}

export const adminAuth = admin.auth();
