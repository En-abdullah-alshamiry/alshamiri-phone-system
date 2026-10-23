import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with exact database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test Connection per guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
      return false;
    }
    // Connected or permission check passed
    return true;
  }
}

// Google Sign-In via Popup
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign-Out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Sync AppData to Firestore for a specific store
export async function syncStoreDataToCloud(
  storeId: string,
  data: AppData
): Promise<void> {
  if (!storeId) return;
  try {
    // Sanitize data to remove any undefined values before writing to Firestore
    const cleanData = JSON.parse(JSON.stringify(data));
    const storeRef = doc(db, 'stores', storeId);
    
    await setDoc(
      storeRef,
      {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`Failed to sync data to cloud for store ${storeId}:`, err);
    throw err;
  }
}

// Fetch single store snapshot
export async function fetchStoreDataFromCloud(
  storeId: string
): Promise<AppData | null> {
  if (!storeId) return null;
  try {
    const storeRef = doc(db, 'stores', storeId);
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      return snap.data() as AppData;
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch store data for store ${storeId}:`, err);
    return null;
  }
}

// Real-time listener for store data
export function subscribeToStoreCloud(
  storeId: string,
  onData: (cloudData: AppData) => void,
  onError?: (err: any) => void
): () => void {
  if (!storeId) return () => {};
  const storeRef = doc(db, 'stores', storeId);
  return onSnapshot(
    storeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppData;
        onData(data);
      }
    },
    (error) => {
      console.warn('Store snapshot sync warning:', error);
      if (onError) onError(error);
    }
  );
}

// Delete store document from Firestore
export async function deleteStoreFromCloud(storeId: string): Promise<void> {
  if (!storeId) return;
  try {
    const storeRef = doc(db, 'stores', storeId);
    await deleteDoc(storeRef);
  } catch (err) {
    console.error(`Failed to delete store ${storeId} from cloud:`, err);
    throw err;
  }
}

