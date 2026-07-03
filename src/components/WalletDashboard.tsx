"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  ApiUnavailableError,
  deposit,
  errorMessage,
  getStatement,
  getWallet,
  withdraw,
} from "@/lib/api";
import { useReconnecting } from "@/lib/connection";
import { formatBRL } from "@/lib/format";
import { addRecent } from "@/lib/recents";
import type { Statement, Wallet } from "@/lib/types";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { StatementSection } from "@/components/StatementSection";
import { TransactionForm } from "@/components/TransactionForm";

interface Toast {
  key: number;
  message: string;
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
    >
      ← Início
    </Link>
  );
}

const RECONNECTING_MESSAGE =
  "Conectando ao servidor… isso pode levar alguns segundos.";

export function WalletDashboard({ walletId }: { walletId: string }) {
  const reconnecting = useReconnecting();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [statementError, setStatementError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);
  const toastKey = useRef(0);
  const copyTimer = useRef<number | null>(null);

  const aplicarCarteira = useCallback((dados: Wallet) => {
    setWallet(dados);
    setNotFound(false);
    setGlobalError(null);
    addRecent({ id: dados.id, owner_name: dados.owner_name });
  }, []);

  const aplicarErro = useCallback((erro: unknown) => {
    if (erro instanceof ApiError && erro.status === 404) {
      setNotFound(true);
    } else {
      setGlobalError(errorMessage(erro));
    }
  }, []);

  const aplicarExtrato = useCallback((dados: Statement) => {
    setStatement(dados);
    setStatementError(null);
  }, []);

  const aplicarErroExtrato = useCallback((erro: unknown) => {
    // 404 já vira a tela de "não encontrada" pelo load da carteira; API
    // fora do ar vira o aviso global — o resto fica no cartão do extrato
    if (erro instanceof ApiError && erro.status === 404) {
      return;
    }
    if (erro instanceof ApiUnavailableError) {
      setGlobalError(errorMessage(erro));
      return;
    }
    setStatementError(errorMessage(erro));
  }, []);

  const load = useCallback(
    () =>
      Promise.all([
        getWallet(walletId).then(aplicarCarteira, aplicarErro),
        getStatement(walletId).then(aplicarExtrato, aplicarErroExtrato),
      ]),
    [walletId, aplicarCarteira, aplicarErro, aplicarExtrato, aplicarErroExtrato],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Toast de sucesso some sozinho; a key reinicia o timer em toasts seguidos
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string) {
    toastKey.current += 1;
    setToast({ key: toastKey.current, message });
  }

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function copyId() {
    if (!wallet) {
      return;
    }
    try {
      await navigator.clipboard.writeText(wallet.id);
      setCopied(true);
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (permissão/contexto): sem feedback, sem quebra
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Carteira não encontrada
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Nenhuma carteira existe com o ID{" "}
          <code className="font-mono text-sm break-all">{walletId}</code>. Confira
          o ID ou crie uma nova carteira.
        </p>
        <Link
          href="/"
          className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
        >
          ← Voltar para o início
        </Link>
      </main>
    );
  }

  if (!wallet) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <BackLink />
        {globalError && !reconnecting ? (
          <div className="mt-8 flex flex-col items-start gap-4">
            <Alert variant="warning">{globalError}</Alert>
            <Button onClick={refresh} loading={refreshing}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div
            className="mt-8 flex flex-col gap-5"
            role="status"
            aria-label="Carregando carteira"
          >
            {reconnecting && (
              <Alert variant="info">{RECONNECTING_MESSAGE}</Alert>
            )}
            <div className="h-44 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="h-72 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-72 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <BackLink />

      {reconnecting ? (
        <Alert variant="info" className="mt-4">
          {RECONNECTING_MESSAGE}
        </Alert>
      ) : (
        globalError && (
          <Alert variant="warning" className="mt-4">
            {globalError}
          </Alert>
        )
      )}

      <section
        aria-label="Resumo da carteira"
        className="mt-6 rounded-2xl bg-indigo-600 p-6 text-white shadow-sm sm:p-8"
      >
        <p className="text-sm text-indigo-200">Titular</p>
        <p className="mt-0.5 text-lg font-semibold">{wallet.owner_name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs break-all text-indigo-200">
            {wallet.id}
          </span>
          <button
            type="button"
            onClick={copyId}
            aria-label="Copiar ID da carteira"
            className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="mt-8 text-sm text-indigo-200">Saldo disponível</p>
        <p
          aria-live="polite"
          className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        >
          {formatBRL(wallet.balance)}
        </p>
      </section>

      <div className="mt-5 grid items-start gap-5 sm:grid-cols-2">
        <TransactionForm
          title="Depositar"
          description="Adicione fundos à carteira."
          submitLabel="Depositar"
          loadingLabel="Depositando…"
          action={(amount, description) => deposit(wallet.id, amount, description)}
          onSuccess={async () => {
            showToast("Depósito realizado.");
            await load();
          }}
          onUnavailable={setGlobalError}
        />
        <TransactionForm
          title="Sacar"
          description="Retire fundos da carteira."
          submitLabel="Sacar"
          loadingLabel="Sacando…"
          action={(amount, description) => withdraw(wallet.id, amount, description)}
          onSuccess={async () => {
            showToast("Saque realizado.");
            await load();
          }}
          onUnavailable={setGlobalError}
        />
      </div>

      <StatementSection
        statement={statement}
        error={statementError}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {toast && (
        <div
          key={toast.key}
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
