"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Preferences } from "../lib/contracts";
import { DEFAULT_PREFERENCES, decodePreferences, STORAGE_KEY } from "../lib/preferences";

type Snapshot = { preferences: Preferences; storage: "ready" | "recovered" | "unavailable" };
const initial: Snapshot = { preferences: DEFAULT_PREFERENCES, storage: "ready" };
let cached = initial;
let lastRaw: string | null | undefined;
let memoryOnly = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
function snapshot(): Snapshot {
  if (memoryOnly) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== lastRaw) {
      const preferences = decodePreferences(raw);
      cached = { preferences: preferences ?? DEFAULT_PREFERENCES, storage: preferences ? "ready" : "recovered" };
      lastRaw = raw;
    }
  } catch {
    memoryOnly = true;
    cached = { ...cached, storage: "unavailable" };
  }
  return cached;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) listener(); };
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}
function update(preferences: Preferences, reset = false) {
  cached = { preferences, storage: memoryOnly ? "unavailable" : "ready" };
  try {
    if (reset) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    lastRaw = reset ? null : JSON.stringify(preferences);
  } catch { memoryOnly = true; cached = { preferences, storage: "unavailable" }; }
  emit();
}
const Context = createContext<Snapshot & { update: typeof update }>({ ...initial, update });
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const value = useSyncExternalStore(subscribe, snapshot, () => initial);
  return <Context.Provider value={{ ...value, update }}>{children}</Context.Provider>;
}
export function usePreferences() { return useContext(Context); }

export function StorageNotice() {
  const { storage } = usePreferences();
  if (storage === "ready") return null;
  return <p className="notice" role="status">{storage === "recovered"
    ? "Saved preferences could not be read. Default settings are in use; choose your preferences again."
    : "Browser storage is unavailable. Your preferences work for this visit but may be lost on reload."}</p>;
}
