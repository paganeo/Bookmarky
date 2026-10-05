import { AppSettings, BackupRecord } from '../types/bookmark';

const SETTINGS_KEY = 'bookmarky_settings';
const DB_NAME = 'Bookmarky_DB';
const DB_VERSION = 1;
const BACKUP_STORE = 'backups';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  backupRetentionCount: 10,
  autoBackupBeforeChanges: true,
  minConfidencePercent: 65,
  preserveExistingStructuredFolders: true,
  searchFields: {
    title: true,
    url: true,
    domain: true,
    folder: true
  },
  autoMaintenance: {
    enabled: false,
    frequency: 'weekly'
  }
};

// IndexedDB Helper for high-capacity backup storage
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        const store = db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageService {
  /**
   * Load App Settings
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(SETTINGS_KEY);
        if (result[SETTINGS_KEY]) {
          return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
        }
      } else if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn('Failed to load settings from storage, using defaults', e);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Save App Settings
   */
  static async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    return updated;
  }

  /**
   * Save a backup record into IndexedDB (with retention enforcement)
   */
  static async saveBackup(backup: BackupRecord): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readwrite');
        const store = tx.objectStore(BACKUP_STORE);
        store.put(backup);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Enforce retention count
      const settings = await this.getSettings();
      await this.enforceBackupRetention(settings.backupRetentionCount);
    } catch (err) {
      console.warn('IndexedDB backup save failed, attempting chrome.storage fallback', err);
      // Fallback
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const key = `backup_${backup.id}`;
        await chrome.storage.local.set({ [key]: backup });
      }
    }
  }

  /**
   * Retrieve all backups sorted newest first
   */
  static async getAllBackups(): Promise<BackupRecord[]> {
    try {
      const db = await openDB();
      return new Promise<BackupRecord[]>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readonly');
        const store = tx.objectStore(BACKUP_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
          const list = (request.result as BackupRecord[]) || [];
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(list);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('IndexedDB read failed, fallback to local', err);
      return [];
    }
  }

  /**
   * Delete a single backup by ID
   */
  static async deleteBackup(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readwrite');
        tx.objectStore(BACKUP_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('Failed to delete backup', e);
    }
  }

  /**
   * Enforce retention policy
   */
  static async enforceBackupRetention(maxBackups: number): Promise<void> {
    if (maxBackups <= 0) return; // 0 or negative means unlimited
    try {
      const backups = await this.getAllBackups();
      // Keep safety backups if possible, but prune oldest general backups
      if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        for (const item of toDelete) {
          await this.deleteBackup(item.id);
        }
      }
    } catch (e) {
      console.warn('Could not enforce backup retention', e);
    }
  }
}
