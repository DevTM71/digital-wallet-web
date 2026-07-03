/**
 * Carteiras recentes em `localStorage` — os últimos 5 IDs criados ou
 * acessados, com o nome do titular. A leitura reativa acontece via
 * `useRecents` (useSyncExternalStore), que devolve lista vazia no
 * servidor e sincroniza no cliente após a hidratação.
 */

import { useSyncExternalStore } from "react";

export interface RecentWallet {
  id: string;
  owner_name: string;
}

const STORAGE_KEY = "digital-wallet:recent-wallets";
const MAX_RECENTS = 5;

function isRecentWallet(value: unknown): value is RecentWallet {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<RecentWallet>;
  return typeof candidate.id === "string" && typeof candidate.owner_name === "string";
}

function parseRecents(raw: string | null): RecentWallet[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isRecentWallet).slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function getRecents(): RecentWallet[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return parseRecents(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

export function addRecent(wallet: RecentWallet): void {
  if (typeof window === "undefined") {
    return;
  }
  const others = getRecents().filter((recent) => recent.id !== wallet.id);
  const next = [wallet, ...others].slice(0, MAX_RECENTS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage cheio ou bloqueado: a lista de recentes é só conveniência
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // outras abas disparam o evento `storage`
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

const EMPTY: RecentWallet[] = [];
let cachedRaw: string | null = null;
let cachedList: RecentWallet[] = EMPTY;

// O snapshot precisa ser referencialmente estável entre chamadas com o
// mesmo conteúdo, senão o useSyncExternalStore re-renderiza em loop
function getSnapshot(): RecentWallet[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseRecents(raw);
  }
  return cachedList;
}

function getServerSnapshot(): RecentWallet[] {
  return EMPTY;
}

export function useRecents(): RecentWallet[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
