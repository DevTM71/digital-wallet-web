"use client";

import { formatBRL, formatDateTime } from "@/lib/format";
import type { Statement, StatementEntry } from "@/lib/types";
import { Alert } from "@/components/Alert";
import { Card } from "@/components/Card";

interface StatementSectionProps {
  /** `null` enquanto o extrato ainda não chegou da API. */
  statement: Statement | null;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

interface EntryStyle {
  label: string;
  sign: "" | "+" | "−";
  iconClass: string;
  amountClass: string;
  icon: React.ReactNode;
}

const ENTRY_STYLES: Record<StatementEntry["type"], EntryStyle> = {
  abertura: {
    label: "Abertura da carteira",
    sign: "",
    iconClass: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    amountClass: "text-zinc-500 dark:text-zinc-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
  deposito: {
    label: "Depósito",
    sign: "+",
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amountClass: "text-emerald-600 dark:text-emerald-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M12 5v14m0 0l-6-6m6 6l6-6" />
      </svg>
    ),
  },
  saque: {
    label: "Saque",
    sign: "−",
    iconClass: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    amountClass: "text-red-600 dark:text-red-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M12 19V5m0 0l-6 6m6-6l6 6" />
      </svg>
    ),
  },
};

function EntryRow({ entry }: { entry: StatementEntry }) {
  const style = ENTRY_STYLES[entry.type];
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {entry.description || style.label}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <time dateTime={entry.occurred_at}>{formatDateTime(entry.occurred_at)}</time>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${style.amountClass}`}>
          {style.sign}
          {formatBRL(entry.amount)}
        </p>
        <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          Saldo: {formatBRL(entry.balance_after)}
        </p>
      </div>
    </li>
  );
}

export function StatementSection({
  statement,
  error,
  refreshing,
  onRefresh,
}: StatementSectionProps) {
  // A ordem dos eventos vem do backend; aqui só invertemos para exibir o
  // mais recente no topo. `balance_after` já chega calculado.
  const entries = statement ? statement.entries.slice().reverse() : [];
  const movements = statement
    ? statement.entries.filter((entry) => entry.type !== "abertura").length
    : 0;

  return (
    <Card className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Extrato
          </h2>
          {statement && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {movements === 1 ? "1 movimentação" : `${movements} movimentações`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
          {refreshing ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error ? (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      ) : !statement ? (
        <div
          className="mt-2 flex flex-col gap-3"
          role="status"
          aria-label="Carregando extrato"
        >
          <div className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ) : movements === 0 ? (
        <p className="mt-2 rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          Nenhuma movimentação ainda — faça seu primeiro depósito.
        </p>
      ) : (
        <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {entries.map((entry, index) => (
            <EntryRow key={entries.length - 1 - index} entry={entry} />
          ))}
        </ol>
      )}

      <p className="mt-4 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Extrato derivado do{" "}
        <a
          href="https://github.com/DevTM71/digital-wallet-api"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          fluxo de eventos (Event Sourcing)
        </a>{" "}
        — nenhuma linha é editável ou apagável.
      </p>
    </Card>
  );
}
