/**
 * Cliente fino sobre `fetch` para a Digital Wallet API.
 *
 * Erros da API (404/409/422, corpo `{detail: string}`) viram `ApiError`;
 * falha de rede (API fora do ar) vira `ApiUnavailableError`, para que a UI
 * consiga distinguir "regra de negócio violada" de "backend inacessível".
 */

import type { Statement, Wallet, WalletCreated } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractDetail(response));
  }

  // Depósito e saque respondem 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

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
