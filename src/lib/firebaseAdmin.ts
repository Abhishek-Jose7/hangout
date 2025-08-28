import admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  // privateKey may contain escaped newlines
  const normalized = privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (clientEmail && projectId && normalized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: normalized,
      }),
    });
  } else {
    // Avoid throwing during build; server-side token verification will fail until envs are provided.
    console.warn('firebase-admin not initialized; missing service account env vars');
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
