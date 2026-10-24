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

// Helper to extract and normalize store document into complete AppData
export function normalizeCloudStoreData(rawDoc: any, storeId: string): AppData {
  if (!rawDoc || typeof rawDoc !== 'object') {
    rawDoc = {};
  }

  const rawInfo = (rawDoc.storeInfo && typeof rawDoc.storeInfo === 'object') ? rawDoc.storeInfo : {};

  // Extract the true commercial store name: prioritize non-placeholder trade names
  let commercialName = '';
  const candidates = [
    rawDoc.storeName,
    rawDoc.name,
    rawInfo.storeName,
    rawInfo.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const clean = candidate.trim();
      if (clean !== 'المتجر المرخص' && (storeId === 'store-shamiri-01' || clean !== 'الشميري فون')) {
        commercialName = clean;
        break;
      }
    }
  }

  // If still empty, accept any string present in candidates
  if (!commercialName) {
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        commercialName = candidate.trim();
        break;
      }
    }
  }

  // Fallback if completely unspecified in Firestore
  if (!commercialName) {
    commercialName = storeId === 'store-shamiri-01' ? 'الشميري فون' : storeId;
  }

  const phone = rawDoc.phone || rawInfo.phone || rawDoc.phone2 || rawInfo.phone2 || '';
  const address = rawDoc.address || rawDoc.city || rawInfo.address || rawInfo.city || '';
  const ownerName = rawDoc.ownerName || rawInfo.ownerName || '';
  const email = rawDoc.email || rawInfo.email || '';
  const subtitle = rawDoc.subtitle || rawInfo.subtitle || 'بيع وشراء الجوالات - صيانة متقدمة - قطع غيار وإكسسوارات';

  const subscription = rawInfo.subscription || rawDoc.subscription || {
    planName: 'باقة المحلات السحابية',
    status: rawDoc.status || 'active',
    expiresAt: rawDoc.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
    licensedDevices: 5,
  };

  const storeInfo: AppData['storeInfo'] = {
    storeId,
    name: commercialName,
    subtitle,
    ownerName,
    phone,
    phone2: rawDoc.phone2 || rawInfo.phone2 || '',
    email,
    address,
    crNumber: rawDoc.crNumber || rawInfo.crNumber || '',
    maintenanceTerms: rawInfo.maintenanceTerms || rawDoc.maintenanceTerms || 'الضمان لمدة 30 يوماً على القطع المستبدلة ضد العيوب المصنعية.',
    salesTerms: rawInfo.salesTerms || rawDoc.salesTerms || 'الأجهزة الجديدة بضمان الوكيل، والأجهزة المستعملة فحص 7 أيام.',
    adminPin: rawInfo.adminPin ?? rawDoc.adminPin ?? '',
    cashierPin: rawInfo.cashierPin ?? rawDoc.cashierPin ?? '',
    technicianPin: rawInfo.technicianPin ?? rawDoc.technicianPin ?? '',
    subscription,
  };

  return {
    storeInfo,
    exchangeRates: rawDoc.exchangeRates || {
      YER_PER_USD: 535,
      YER_PER_SAR: 140,
      lastUpdated: new Date().toISOString(),
    },
    products: Array.isArray(rawDoc.products) ? rawDoc.products : [],
    maintenanceTickets: Array.isArray(rawDoc.maintenanceTickets) ? rawDoc.maintenanceTickets : [],
    salesInvoices: Array.isArray(rawDoc.salesInvoices) ? rawDoc.salesInvoices : [],
    purchaseInvoices: Array.isArray(rawDoc.purchaseInvoices) ? rawDoc.purchaseInvoices : [],
    cashTransactions: Array.isArray(rawDoc.cashTransactions) ? rawDoc.cashTransactions : [],
    expenseVouchers: Array.isArray(rawDoc.expenseVouchers) ? rawDoc.expenseVouchers : [],
    receiptVouchers: Array.isArray(rawDoc.receiptVouchers) ? rawDoc.receiptVouchers : [],
    currencyExchanges: Array.isArray(rawDoc.currencyExchanges) ? rawDoc.currencyExchanges : [],
    customers: Array.isArray(rawDoc.customers) ? rawDoc.customers : [],
  };
}

// Sync AppData to Firestore for a specific store
export async function syncStoreDataToCloud(
  storeId: string,
  data: AppData
): Promise<void> {
  if (!storeId) return;
  // Safety guard: never sync placeholder name 'المتجر المرخص' to Firestore
  if (storeId !== 'store-shamiri-01' && (data.storeInfo?.name === 'المتجر المرخص' || !data.storeInfo?.name)) {
    return;
  }

  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    const storeRef = doc(db, 'stores', storeId);
    
    await setDoc(
      storeRef,
      {
        ...cleanData,
        storeId,
        storeName: cleanData.storeInfo?.name,
        name: cleanData.storeInfo?.name,
        phone: cleanData.storeInfo?.phone,
        address: cleanData.storeInfo?.address,
        ownerName: cleanData.storeInfo?.ownerName,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`Failed to sync data to cloud for store ${storeId}:`, err);
    throw err;
  }
}

// Dedicated function to save store PINs directly to /stores/{storeId}/settings/pins
export async function saveStorePinsToCloud(
  storeId: string,
  pins: { adminPin: string; cashierPin: string; technicianPin: string }
): Promise<void> {
  if (!storeId || !storeId.trim()) return;
  const cleanId = storeId.trim();
  try {
    // 1. Direct write to /stores/{storeId}/settings/pins document
    const pinsRef = doc(db, 'stores', cleanId, 'settings', 'pins');
    await setDoc(
      pinsRef,
      {
        adminPin: pins.adminPin.trim(),
        cashierPin: pins.cashierPin.trim(),
        technicianPin: pins.technicianPin.trim(),
        storeId: cleanId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Also sync to main store document stores/{storeId} for instant root accessibility
    const storeRef = doc(db, 'stores', cleanId);
    await setDoc(
      storeRef,
      {
        adminPin: pins.adminPin.trim(),
        cashierPin: pins.cashierPin.trim(),
        technicianPin: pins.technicianPin.trim(),
        storeInfo: {
          adminPin: pins.adminPin.trim(),
          cashierPin: pins.cashierPin.trim(),
          technicianPin: pins.technicianPin.trim(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`Failed to save store PINs to cloud for store ${cleanId}:`, err);
    throw err;
  }
}

// Fetch single store snapshot directly from Firestore path stores/{storeId}
export async function fetchStoreDataFromCloud(
  storeId: string
): Promise<AppData | null> {
  if (!storeId || !storeId.trim()) return null;
  const cleanId = storeId.trim();
  try {
    const storeRef = doc(db, 'stores', cleanId);
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      const raw = snap.data();
      // Also check if dedicated /stores/{storeId}/settings/pins exists
      try {
        const pinsSnap = await getDoc(doc(db, 'stores', cleanId, 'settings', 'pins'));
        if (pinsSnap.exists()) {
          const pinsData = pinsSnap.data();
          if (pinsData.adminPin) raw.adminPin = pinsData.adminPin;
          if (pinsData.cashierPin) raw.cashierPin = pinsData.cashierPin;
          if (pinsData.technicianPin) raw.technicianPin = pinsData.technicianPin;
          if (!raw.storeInfo) raw.storeInfo = {};
          if (pinsData.adminPin) raw.storeInfo.adminPin = pinsData.adminPin;
          if (pinsData.cashierPin) raw.storeInfo.cashierPin = pinsData.cashierPin;
          if (pinsData.technicianPin) raw.storeInfo.technicianPin = pinsData.technicianPin;
        }
      } catch (e) {
        // ignore if not configured yet
      }
      return normalizeCloudStoreData(raw, cleanId);
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch store data for store ${cleanId}:`, err);
    return null;
  }
}

// Real-time listener for store data directly from stores/{storeId}
export function subscribeToStoreCloud(
  storeId: string,
  onData: (cloudData: AppData) => void,
  onError?: (err: any) => void
): () => void {
  if (!storeId || !storeId.trim()) return () => {};
  const cleanId = storeId.trim();
  const storeRef = doc(db, 'stores', cleanId);
  return onSnapshot(
    storeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const normalized = normalizeCloudStoreData(raw, cleanId);
        onData(normalized);
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
    const storeRef = doc(db, 'stores', storeId.trim());
    await deleteDoc(storeRef);
  } catch (err) {
    console.error(`Failed to delete store ${storeId} from cloud:`, err);
    throw err;
  }
}


