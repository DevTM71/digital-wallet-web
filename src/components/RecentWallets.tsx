"use client";

import Link from "next/link";
import { useRecents } from "@/lib/recents";

export function RecentWallets() {
  const recents = useRecents();

  return (
    <section className="mt-12" aria-labelledby="recentes-titulo">
      <h2
        id="recentes-titulo"
        className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
      >
        Carteiras recentes
      </h2>
      {recents.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          As carteiras que você criar ou acessar aparecem aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recents.map((recent) => (
            <li key={recent.id}>
              <Link
                href={`/wallet/${encodeURIComponent(recent.id)}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm transition-colors hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {recent.owner_name}
                </span>
                <span className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {recent.id}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
