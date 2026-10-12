import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!apiKey || apiKey === 'your_firebase_api_key_here') {
  throw new Error('Missing VITE_FIREBASE_API_KEY. Configure it in your local environment.');
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fresh-clothes.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fresh-clothes',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fresh-clothes.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '451824039221',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:451824039221:web:b24cdf451d794cff4d087c',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
