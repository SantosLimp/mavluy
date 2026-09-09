import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  projectId: 'confident-psyche-153bd',
  appId: '1:717588455945:web:f3c7f86b717fe856290ed8',
  apiKey: 'AIzaSyCJsRm116xN1Uxwt0koaxbKvBu7vDthm18',
  authDomain: 'confident-psyche-153bd.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-remixmoroccaneco-38a3aa37-c197-4bb7-9edb-a7603ea87816',
  storageBucket: 'confident-psyche-153bd.firebasestorage.app',
  messagingSenderId: '717588455945',
  measurementId: '',
  oAuthClientId: '717588455945-hlf08i7srlj77vtlkdg1joerimlifspq.apps.googleusercontent.com',
  recaptchaSiteKey: ''
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_test_collection', 'ping'));
    return true;
  } catch (error: any) {
    if (error?.message && error.message.includes('the client is offline')) {
      console.warn('Firebase offline or unreachable');
      return false;
    }
    return true;
  }
}
