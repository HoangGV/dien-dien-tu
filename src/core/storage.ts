/**
 * Storage Service for "Mạch điện – Điện tử"
 * Handles localStorage with seamless automatic fallback to IndexedDB (idb-keyval)
 * on QuotaExceededError. Includes debounce autosave, prefix isolation, and memory tracking.
 */

import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { CircuitState } from './types';

export const STORAGE_PREFIX = 'cn-dien:v1:';
export const SETTINGS_KEY = `${STORAGE_PREFIX}_settings`;

export interface StorageStats {
  usedBytes: number;
  formattedSize: string;
  itemCount: number;
  hasPersistentStorage: boolean;
}

export class StorageService {
  private static instance: StorageService;
  private fallbackToIdb = false;

  private constructor() {
    this.initStoragePersistence();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async initStoragePersistence() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch {
      // Ignore if unsupported or restricted in environment
    }
  }

  public getWorkspaceKey(slug: string): string {
    return `${STORAGE_PREFIX}${slug}`;
  }

  public async saveCircuit(slug: string, state: CircuitState): Promise<boolean> {
    const key = this.getWorkspaceKey(slug);
    // Strip dynamic runtime variables if any, keep only static parameters & damaged flags
    const cleanState: CircuitState = {
      components: state.components.map(c => ({
        id: c.id,
        type: c.type,
        x: c.x,
        y: c.y,
        rot: c.rot,
        flip: c.flip,
        label: c.label || '',
        props: { ...c.props },
        damaged: !!c.damaged,
        damageReason: c.damageReason,
        install: c.install ? { x: c.install.x, y: c.install.y, rot: c.install.rot } : undefined,
      })),
      wires: state.wires.map(w => ({
        id: w.id,
        from: { ...w.from },
        to: { ...w.to },
        points: w.points.map(p => ({ x: p.x, y: p.y })),
        color: w.color,
        crossSection: w.crossSection,
        isBurnt: !!w.isBurnt,
      })),
      junctions: state.junctions.map(j => ({
        id: j.id,
        x: j.x,
        y: j.y,
        install: j.install ? { x: j.install.x, y: j.install.y } : undefined,
      })),
      viewport: { ...state.viewport },
      floorPlan: state.floorPlan ? { ...state.floorPlan } : undefined,
    };

    const serialized = JSON.stringify(cleanState);

    if (!this.fallbackToIdb) {
      try {
        localStorage.setItem(key, serialized);
        return true;
      } catch (err: any) {
        if (err.name === 'QuotaExceededError' || err.code === 22) {
          console.warn('[StorageService] localStorage quota exceeded, migrating to IndexedDB');
          this.fallbackToIdb = true;
        } else {
          console.error('[StorageService] Error saving to localStorage:', err);
        }
      }
    }

    try {
      await idbSet(key, serialized);
      return true;
    } catch (idbErr) {
      console.error('[StorageService] Error saving to IndexedDB fallback:', idbErr);
      return false;
    }
  }

  public async loadCircuit(slug: string): Promise<CircuitState | null> {
    const key = this.getWorkspaceKey(slug);
    let serialized: string | null = null;

    try {
      serialized = localStorage.getItem(key);
    } catch {
      // LocalStorage access may fail in private mode
    }

    if (!serialized) {
      try {
        const val = await idbGet<string>(key);
        if (val) serialized = val;
      } catch (err) {
        console.error('[StorageService] Error loading from IndexedDB:', err);
      }
    }

    if (!serialized) return null;

    try {
      const parsed = JSON.parse(serialized);
      if (parsed && Array.isArray(parsed.components) && Array.isArray(parsed.wires)) {
        return parsed as CircuitState;
      }
    } catch (parseErr) {
      console.error('[StorageService] Corrupt circuit state JSON:', parseErr);
    }

    return null;
  }

  public async hasSavedCircuit(slug: string): Promise<boolean> {
    const state = await this.loadCircuit(slug);
    return state !== null && (state.components.length > 0 || state.wires.length > 0);
  }

  public async clearWorkspace(slug: string): Promise<void> {
    const key = this.getWorkspaceKey(slug);
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      await idbDel(key);
    } catch {}
  }

  public async clearAllWorkspaces(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}

    try {
      const keys = await idbKeys();
      for (const k of keys) {
        if (typeof k === 'string' && k.startsWith(STORAGE_PREFIX)) {
          await idbDel(k);
        }
      }
    } catch {}
  }

  public async getStorageStats(): Promise<StorageStats> {
    let totalBytes = 0;
    let count = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          const val = localStorage.getItem(k) || '';
          totalBytes += (k.length + val.length) * 2; // UTF-16 approximation
          count++;
        }
      }
    } catch {}

    let persisted = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        persisted = await navigator.storage.persisted();
      }
    } catch {}

    const formatted = totalBytes < 1024
      ? `${totalBytes} B`
      : totalBytes < 1024 * 1024
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;

    return {
      usedBytes: totalBytes,
      formattedSize: formatted,
      itemCount: count,
      hasPersistentStorage: persisted,
    };
  }
}

/**
 * Creates a debounced saver utility
 */
export function createDebouncedSaver(
  saveFn: (slug: string, state: CircuitState) => Promise<boolean>,
  delayMs = 500
) {
  let timer: any = null;
  let pendingSlug = '';
  let pendingState: CircuitState | null = null;

  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pendingSlug && pendingState) {
      await saveFn(pendingSlug, pendingState);
      pendingSlug = '';
      pendingState = null;
    }
  };

  const schedule = (slug: string, state: CircuitState) => {
    pendingSlug = slug;
    pendingState = state;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      flush();
    }, delayMs);
  };

  // Attach auto-flush on page unload / hide
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });
  }

  return { schedule, flush };
}
