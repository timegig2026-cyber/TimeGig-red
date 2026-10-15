/**
 * Safe client-side device storage using native IndexedDB for images/media
 * and protected localStorage with quota safety and user isolation.
 */

const DB_NAME = 'timegig_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Stores a large media asset (such as profile avatar or ID document) in IndexedDB.
 * Does not bloat localStorage.
 */
export async function saveMediaItem(key: string, data: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save media'));
    });
  } catch (err) {
    console.warn(`[storage] Could not save media item "${key}" to IndexedDB:`, err);
  }
}

/**
 * Retrieves a media asset from IndexedDB.
 */
export async function getMediaItem(key: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error || new Error('Failed to get media'));
    });
  } catch (err) {
    console.warn(`[storage] Could not retrieve media item "${key}" from IndexedDB:`, err);
    return null;
  }
}

/**
 * Safe localStorage wrapper that catches QuotaExceededError and isolates by userId.
 */
export function safeSaveProfile<T>(userId: string, data: T): boolean {
  try {
    const key = `timegig_profile_${userId || 'default'}`;
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn('[storage] Safe localStorage save failed (quota or access restricted):', err);
    return false;
  }
}

/**
 * Safe localStorage reader with user isolation.
 */
export function safeLoadProfile<T>(userId: string, fallback: T): T {
  try {
    const key = `timegig_profile_${userId || 'default'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (err) {
    console.warn('[storage] Safe localStorage load failed:', err);
  }
  return fallback;
}
