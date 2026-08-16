'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_CHANGE_EVENT = 'supply-chain-storage-change';

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(STORAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

function getServerStorageSnapshot() {
  return null;
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

/**
 * Read browser storage without creating a server/client hydration mismatch.
 * The custom event also keeps consumers in the current tab synchronized,
 * because the native `storage` event only fires in other documents.
 */
export function useBrowserStorage(key: string) {
  const getSnapshot = useCallback(() => localStorage.getItem(key), [key]);

  return useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerStorageSnapshot,
  );
}

export function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
}

export function setBrowserStorage(key: string, value: string | null) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }

  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
}
