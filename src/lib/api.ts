/**
 * Cliente fino sobre `fetch` para a Digital Wallet API.
 *
 * Erros da API (404/409/422, corpo `{detail: string}`) viram `ApiError`;
 * falha de rede (API fora do ar) vira `ApiUnavailableError`, para que a UI
 * consiga distinguir "regra de negócio violada" de "backend inacessível".
 *
 * Resiliência a religamento do backend (deploy/manutenção no Render):
 * toda requisição tem timeout, e GETs — idempotentes — ganham até 2 retries
 * com backoff, sinalizados à UI via `connection.ts`. POSTs nunca sofrem
 * retry automático: depósito/saque não podem correr risco de duplicar.
 */

import { beginReconnecting, endReconnecting } from "./connection";
import type { Statement, Wallet, WalletCreated } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 12_000;
const RETRY_BACKOFF_MS = [2_000, 5_000];

const GENERIC_ERROR_DETAIL = "Erro inesperado ao comunicar com a API.";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export class ApiUnavailableError extends Error {
  constructor() {
    super("Não foi possível conectar à API. Verifique se ela está no ar.");
    this.name = "ApiUnavailableError";
  }
}

/** Converte qualquer erro do cliente em mensagem pronta para a UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiUnavailableError) {
    return `API fora do ar — verifique se o backend está rodando em ${API_URL}`;
  }
  if (error instanceof ApiError) {
    // 422 de validação de borda (FastAPI) traz `detail` como lista e cai
    // no fallback genérico; para o usuário, é sempre um valor inválido
    if (error.status === 422 && error.detail === GENERIC_ERROR_DETAIL) {
      return "Valor inválido.";
    }
    return error.detail;
  }
  return GENERIC_ERROR_DETAIL;
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    // Erros de validação do FastAPI trazem `detail` como lista; só os
    // erros de domínio da API garantem string
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // corpo ausente ou não-JSON: cai no fallback genérico
  }
  return GENERIC_ERROR_DETAIL;
}

export interface RequesterDeps {
  fetchImpl: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  /** Início/fim de um ciclo de retries — a UI mostra "conectando…". */
  onRetryStart: () => void;
  onRetryEnd: () => void;
}

/**
 * Fábrica do `request` com dependências injetáveis (fetch, sleep e
 * notificação de retry) para permitir teste unitário da lógica de
 * timeout/retry sem rede nem timers reais.
 */
export function createRequester(deps: RequesterDeps) {
  async function attempt(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await deps.fetchImpl(url, { ...init, signal: controller.signal });
    } catch {
      // falha de rede ou timeout (abort) — HTTP com status de erro não cai aqui
      throw new ApiUnavailableError();
    } finally {
      clearTimeout(timer);
    }
  }

  async function attemptWithRetries(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    try {
      return await attempt(url, init);
    } catch (error) {
      deps.onRetryStart();
      try {
        for (const backoffMs of RETRY_BACKOFF_MS) {
          await deps.sleep(backoffMs);
          try {
            return await attempt(url, init);
          } catch {
            // próxima tentativa (ou erro definitivo abaixo)
          }
        }
        throw error;
      } finally {
        deps.onRetryEnd();
      }
    }
  }

  return async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${API_URL}${path}`;
    const finalInit: RequestInit = {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    };

    // Só GET é idempotente; repetir um POST poderia duplicar depósito/saque
    const retryable = (init.method ?? "GET") === "GET";
    const response = retryable
      ? await attemptWithRetries(url, finalInit)
      : await attempt(url, finalInit);

    if (!response.ok) {
      throw new ApiError(response.status, await extractDetail(response));
    }

    // Depósito e saque respondem 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  };
}

const request = createRequester({
  // arrow para não perder o `this` do fetch do navegador
  fetchImpl: (input, init) => fetch(input, init),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onRetryStart: beginReconnecting,
  onRetryEnd: endReconnecting,
});

export function openWallet(ownerName: string): Promise<WalletCreated> {
  return request<WalletCreated>("/wallets", {
    method: "POST",
    body: JSON.stringify({ owner_name: ownerName }),
  });
}

export function deposit(
  walletId: string,
  amount: string,
  description = "",
): Promise<void> {
  return request<void>(`/wallets/${encodeURIComponent(walletId)}/deposits`, {
    method: "POST",
    body: JSON.stringify({ amount, description }),
  });
}

export function withdraw(
  walletId: string,
  amount: string,
  description = "",
): Promise<void> {
  return request<void>(`/wallets/${encodeURIComponent(walletId)}/withdrawals`, {
    method: "POST",
    body: JSON.stringify({ amount, description }),
  });
}

export function getWallet(walletId: string): Promise<Wallet> {
  return request<Wallet>(`/wallets/${encodeURIComponent(walletId)}`);
}

export function getStatement(walletId: string): Promise<Statement> {
  return request<Statement>(`/wallets/${encodeURIComponent(walletId)}/statement`);
}
