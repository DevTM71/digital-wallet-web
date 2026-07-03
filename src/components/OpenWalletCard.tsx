"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, openWallet } from "@/lib/api";
import { addRecent } from "@/lib/recents";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";

export function OpenWalletCard() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nome = ownerName.trim();
    if (!nome) {
      setError("Informe o nome do titular.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { id } = await openWallet(nome);
      addRecent({ id, owner_name: nome });
      router.push(`/wallet/${id}`);
    } catch (erro) {
      setError(errorMessage(erro));
      setLoading(false);
    }
  }

  return (
    <Card title="Criar carteira">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Abra uma nova carteira com saldo zero.
        </p>
        <TextField
          id="owner-name"
          label="Nome do titular"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Maria Silva"
          maxLength={120}
          autoComplete="name"
          required
        />
        <Button type="submit" loading={loading}>
          {loading ? "Criando…" : "Criar carteira"}
        </Button>
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </Card>
  );
}
