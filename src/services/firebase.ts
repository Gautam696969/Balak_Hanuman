import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, Database, Unsubscribe } from 'firebase/database';
import { Match } from '../types/cricket';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'BH_FIREBASE_CONFIG';

// 1. Get stored config from localStorage or import.meta.env
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.databaseURL || parsed.projectId) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse local firebase config', err);
  }

  // Check env vars
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  if (envConfig.databaseURL || envConfig.projectId) {
    return envConfig;
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
  // Reset existing app so it re-initializes with new config
  activeDb = null;
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return !!(config && (config.databaseURL || config.projectId));
}

let activeApp: FirebaseApp | null = null;
let activeDb: Database | null = null;

export function getFirebaseDb(): Database | null {
  if (activeDb) return activeDb;

  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!getApps().length) {
      activeApp = initializeApp(config);
    } else {
      activeApp = getApp();
    }
    activeDb = getDatabase(activeApp);
    return activeDb;
  } catch (err) {
    console.error('Error initializing Firebase Realtime Database:', err);
    return null;
  }
}

/**
 * Publish match state to Firebase Realtime Database
 */
export async function syncMatchToCloud(match: Match): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      return { success: false, error: 'Firebase not configured' };
    }

    const matchRef = ref(db, `matches/${match.id}`);
    await set(matchRef, {
      ...match,
      _syncedAt: Date.now(),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to sync match to Firebase:', err);
    return { success: false, error: err?.message || 'Failed to sync to cloud' };
  }
}

/**
 * Subscribe to realtime updates for a match
 */
export function subscribeToLiveMatch(
  matchId: string,
  onUpdate: (match: Match) => void,
  onError?: (err: Error) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) {
    if (onError) onError(new Error('Firebase is not configured'));
    return () => {};
  }

  const matchRef = ref(db, `matches/${matchId}`);
  
  const unsubscribe: Unsubscribe = onValue(
    matchRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onUpdate(data as Match);
      }
    },
    (error) => {
      console.error('Firebase realtime subscription error:', error);
      if (onError) onError(error);
    }
  );

  return () => {
    unsubscribe();
  };
}

/**
 * Fetch match state once
 */
export async function fetchLiveMatchOnce(matchId: string): Promise<Match | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const matchRef = ref(db, `matches/${matchId}`);
    const snapshot = await get(matchRef);
    if (snapshot.exists()) {
      return snapshot.val() as Match;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch match:', err);
    return null;
  }
}
