"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";

export function AccessWalletCard() {
  const router = useRouter();
  const [walletId, setWalletId] = useState("");
  const [navigating, setNavigating] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = walletId.trim();
    if (!id) {
      return;
    }
    setNavigating(true);
    router.push(`/wallet/${encodeURIComponent(id)}`);
  }

  return (
    <Card title="Acessar carteira">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Já tem uma carteira? Informe o ID para abrir o painel.
        </p>
        <TextField
          id="wallet-id"
          label="ID da carteira"
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
          placeholder="ex.: 6f1c9a4e-…"
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <Button type="submit" loading={navigating}>
          {navigating ? "Abrindo…" : "Acessar carteira"}
        </Button>
      </form>
    </Card>
  );
}
