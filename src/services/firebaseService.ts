import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref as dbRef, set as dbSet, get as dbGet, onValue as dbOnValue, update as dbUpdate, Database } from 'firebase/database';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface SyncPayload {
  terminalId: string;
  branchId: string;
  timestamp: string;
  entityName: string;
  entityId: string;
  data: any;
}

import { appConfig, isFirebaseConfigured } from './config';

export const isCloudConfigured = isFirebaseConfigured();

const firebaseConfigValues: FirebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  databaseURL: appConfig.firebase.databaseURL,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
  measurementId: appConfig.firebase.measurementId,
};

function assertCloudConfigured(): boolean {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Cloud sync disabled — missing VITE_FIREBASE_* env. Running offline-first.');
    return false;
  }
  return true;
}

// Initialize Firebase App instance — safe offline-first: never throws when env is missing.
function initFirebaseSafe() {
  try {
    if (!isFirebaseConfigured()) return { app: null as unknown as ReturnType<typeof getApp>, auth: null as unknown as ReturnType<typeof getAuth>, rtdb: null as unknown as Database, storage: null as unknown as FirebaseStorage };
    const app = getApps().length === 0 ? initializeApp(firebaseConfigValues) : getApp();
    return { app, auth: getAuth(app), rtdb: getDatabase(app), storage: getStorage(app) };
  } catch (err) {
    console.warn('[Firebase] Init skipped (offline mode):', err);
    return { app: null as unknown as ReturnType<typeof getApp>, auth: null as unknown as ReturnType<typeof getAuth>, rtdb: null as unknown as Database, storage: null as unknown as FirebaseStorage };
  }
}

const _fb = initFirebaseSafe();
export const firebaseApp = _fb.app;
export const auth = _fb.auth;
export const rtdb: Database | null = _fb.rtdb;
export const storage: FirebaseStorage | null = _fb.storage;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Perform real Google SSO Sign-In via Firebase Auth
 */
export async function signInWithGoogleReal(): Promise<FirebaseUser> {
  if (!auth || !assertCloudConfigured()) throw new Error('Cloud sign-in is not configured (missing VITE_FIREBASE_* env).');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

class FirebaseService {
  private config: FirebaseConfig;
  private isOnline = true;
  private sseEventSource: EventSource | null = null;
  private terminalId: string;

  constructor() {
    this.config = firebaseConfigValues;
    this.terminalId = 'term_' + Math.random().toString(36).substring(2, 8);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  /**
   * Sync a record or order update to Firebase Realtime Database.
   */
  public async syncRecord(
    path: string,
    data: any
  ): Promise<boolean> {
    if (!this.isOnline || !this.config.databaseURL) return false;

    try {
      const url = `${this.config.databaseURL}/${path}.json`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          _syncMetadata: {
            terminalId: this.terminalId,
            syncedAt: new Date().toISOString(),
          },
        }),
      });

      return response.ok;
    } catch (err) {
      console.warn(`[Firebase] Sync to ${path} failed:`, err);
      return false;
    }
  }

  /**
   * Listen to realtime updates on a specific path using Server-Sent Events (SSE).
   */
  public subscribeToRealtimePath(
    path: string,
    onData: (data: any) => void
  ): () => void {
    if (typeof window === 'undefined' || !('EventSource' in window)) {
      return () => {};
    }

    try {
      const url = `${this.config.databaseURL}/${path}.json`;
      const source = new EventSource(url);

      source.addEventListener('put', (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.data) {
            onData(parsed.data);
          }
        } catch (e) {
          console.error('[Firebase SSE] Error parsing message:', e);
        }
      });

      source.onerror = () => {
        // SSE handles reconnection automatically
      };

      return () => {
        source.close();
      };
    } catch (e) {
      console.warn('[Firebase] SSE subscription error:', e);
      return () => {};
    }
  }

  /**
   * Track Business Analytics Event via Google Analytics 4 Measurement Protocol.
   */
  public async trackEvent(
    eventName: string,
    params: Record<string, any> = {}
  ): Promise<void> {
    try {
      // 1. If gtag is available in window
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
        return;
      }

      // 2. Direct Measurement Protocol API call
      if (!this.config.measurementId) return;

      const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${this.config.measurementId}&api_secret=client_pos_secret`;
      
      await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          client_id: this.terminalId,
          events: [
            {
              name: eventName,
              params: {
                ...params,
                terminal_id: this.terminalId,
                timestamp_micros: Date.now() * 1000,
              },
            },
          ],
        }),
      }).catch(() => {});
    } catch (e) {
      // Non-blocking analytics
    }
  }

  /**
   * Send In-App & Browser Notification
   */
  public async showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      tag?: string;
      data?: any;
    }
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check Notification API permission
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
        });
      }
    }
  }

  /**
   * Sync Order to Firebase Realtime Database
   */
  public async syncOrder(branchId: string, order: any): Promise<boolean> {
    try {
      if (rtdb) {
        const orderPath = `orders/${branchId || 'default'}/${order.id}`;
        await dbSet(dbRef(rtdb, orderPath), {
          ...order,
          _updatedAt: new Date().toISOString(),
          _terminalId: this.terminalId,
        });
        return true;
      }
      return this.syncRecord(`orders/${branchId || 'default'}/${order.id}`, order);
    } catch (e) {
      console.warn('[Firebase] syncOrder fallback:', e);
      return this.syncRecord(`orders/${branchId || 'default'}/${order.id}`, order);
    }
  }

  /**
   * Realtime Listener for Live Orders (POS <-> KDS <-> Waiter <-> Customer Portal)
   */
  public subscribeToOrders(branchId: string, onOrders: (orders: any[]) => void): () => void {
    try {
      if (rtdb) {
        const ordersRef = dbRef(rtdb, `orders/${branchId || 'default'}`);
        return dbOnValue(ordersRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const list = Object.values(val);
            onOrders(list);
          } else {
            onOrders([]);
          }
        });
      }
    } catch (e) {
      console.warn('[Firebase] subscribeToOrders fallback to SSE:', e);
    }
    return this.subscribeToRealtimePath(`orders/${branchId || 'default'}`, (data) => {
      if (data) {
        const list = Object.values(data);
        onOrders(list);
      }
    });
  }

  /**
   * Sync Menu Catalog to Firebase
   */
  public async syncMenuCatalog(branchId: string, categories: any[], dishes: any[]): Promise<boolean> {
    try {
      if (rtdb) {
        await dbSet(dbRef(rtdb, `menu/${branchId || 'default'}`), {
          categories,
          dishes,
          _syncedAt: new Date().toISOString(),
        });
        return true;
      }
      return this.syncRecord(`menu/${branchId || 'default'}`, { categories, dishes });
    } catch (e) {
      return this.syncRecord(`menu/${branchId || 'default'}`, { categories, dishes });
    }
  }

  /**
   * Sync Live Inventory & Stocks
   */
  public async syncInventoryStock(branchId: string, inventoryItems: any[]): Promise<boolean> {
    try {
      if (rtdb) {
        await dbSet(dbRef(rtdb, `inventory/${branchId || 'default'}`), {
          items: inventoryItems,
          _syncedAt: new Date().toISOString(),
        });
        return true;
      }
      return this.syncRecord(`inventory/${branchId || 'default'}`, { items: inventoryItems });
    } catch (e) {
      return this.syncRecord(`inventory/${branchId || 'default'}`, { items: inventoryItems });
    }
  }

  /**
   * Sync Shift & Z-Report
   */
  public async syncShift(branchId: string, shiftSession: any): Promise<boolean> {
    try {
      if (rtdb) {
        await dbSet(dbRef(rtdb, `shifts/${branchId || 'default'}/${shiftSession.id}`), {
          ...shiftSession,
          _syncedAt: new Date().toISOString(),
        });
        return true;
      }
      return this.syncRecord(`shifts/${branchId || 'default'}/${shiftSession.id}`, shiftSession);
    } catch (e) {
      return this.syncRecord(`shifts/${branchId || 'default'}/${shiftSession.id}`, shiftSession);
    }
  }

  /**
   * Sync Floor Plan & Table Live States
   */
  public async syncTableStatuses(branchId: string, tables: any[]): Promise<boolean> {
    try {
      if (rtdb) {
        await dbSet(dbRef(rtdb, `tables/${branchId || 'default'}`), {
          tables,
          _syncedAt: new Date().toISOString(),
        });
        return true;
      }
      return this.syncRecord(`tables/${branchId || 'default'}`, { tables });
    } catch (e) {
      return this.syncRecord(`tables/${branchId || 'default'}`, { tables });
    }
  }

  /**
   * Upload Image or Receipt attachment to Firebase Cloud Storage
   */
  public async uploadToCloudStorage(storagePath: string, dataUrlOrBase64: string): Promise<string | null> {
    try {
      if (!storage) return null;
      const fileRef = storageRef(storage, storagePath);
      const isDataUrl = dataUrlOrBase64.startsWith('data:');
      const format = isDataUrl ? 'data_url' : 'raw';
      
      await uploadString(fileRef, dataUrlOrBase64, format as any);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (err) {
      console.warn(`[Firebase Storage] Upload failed for ${storagePath}:`, err);
      return null;
    }
  }

  public getTerminalId(): string {
    return this.terminalId;
  }
}

export const firebaseService = new FirebaseService();
