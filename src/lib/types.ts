/**
 * Tipos que espelham os schemas Pydantic da Digital Wallet API.
 *
 * `amount`, `balance` e `balance_after` são strings por decisão da API:
 * valores monetários trafegam como decimais serializados para evitar erro
 * de ponto flutuante. A formatação para exibição (R$, datas) acontece na
 * UI, via helpers de `src/lib/format.ts`.
 */

export interface WalletCreated {
  id: string;
}

export interface Wallet {
  id: string;
  owner_name: string;
  balance: string;
  version: number;
}

export interface StatementEntry {
  type: "abertura" | "deposito" | "saque";
  amount: string;
  balance_after: string;
  description: string;
  occurred_at: string;
}

export interface Statement {
  wallet_id: string;
  entries: StatementEntry[];
}
