/**
 * Estado de reconexão com a API — fica `true` enquanto alguma requisição
 * GET esgota seus retries (backend religando, ex.: cold start do Render).
 * A UI usa isso para mostrar "conectando…" em vez do erro seco; o erro
 * definitivo só aparece quando os retries acabam e o estado volta a `false`.
 *
 * Leitura reativa via `useReconnecting` (useSyncExternalStore), no mesmo
 * padrão de `recents.ts`.
 */

import { useSyncExternalStore } from "react";

// Contador (e não boolean) porque GETs concorrentes — carteira + extrato —
// podem estar em retry ao mesmo tempo
let activeRetries = 0;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function beginReconnecting(): void {
  activeRetries += 1;
  if (activeRetries === 1) {
    emit();
  }
}

export function endReconnecting(): void {
  activeRetries = Math.max(0, activeRetries - 1);
  if (activeRetries === 0) {
    emit();
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  return activeRetries > 0;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReconnecting(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
