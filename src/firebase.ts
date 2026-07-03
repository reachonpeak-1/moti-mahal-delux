/**
 * Firebase Configuration & Initialization
 * All Firebase services are initialized here and exported for use across the app.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const rawApiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = !!rawApiKey && rawApiKey !== 'your-api-key-here' && rawApiKey !== '';

if (!isFirebaseConfigured) {
  console.warn(
    '⚠️ Firebase configuration is missing or using placeholder values! ' +
    'Please create a .env file with your Firebase credentials to enable live database features.'
  );
}

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : 'mock-api-key-to-prevent-initialization-crash',
  authDomain: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN : 'mock-project.firebaseapp.com',
  projectId: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_PROJECT_ID : 'mock-project-id',
  storageBucket: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET : 'mock-project.appspot.com',
  messagingSenderId: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID : '1234567890',
  appId: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_APP_ID : '1:1234567890:web:1234567890',
  measurementId: isFirebaseConfigured ? (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID : 'G-MOCK',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-south1'); // Mumbai region for Indian users

// Connect to emulators in development (uncomment when using Firebase emulators)
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export default app;
