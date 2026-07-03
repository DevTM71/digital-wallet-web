"use client";

import { useId, useState, type FormEvent } from "react";
import { ApiUnavailableError, errorMessage } from "@/lib/api";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";

interface TransactionFormProps {
  title: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  /** Chama a API com o valor já normalizado ("150.00") e a descrição. */
  action: (amount: string, description: string) => Promise<void>;
  /** Disparado após sucesso; o formulário fica em loading até resolver. */
  onSuccess: () => Promise<void>;
  /** API fora do ar: o aviso é global, não do cartão. */
  onUnavailable: (message: string) => void;
}

/**
 * Valida e normaliza o valor digitado: aceita vírgula ou ponto como
 * separador decimal, exige número > 0 com até 2 casas. Regras de negócio
 * (ex.: saldo insuficiente) ficam no backend.
 */
function normalizeAmount(input: string): string | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  if (Number(normalized) <= 0) {
    return null;
  }
  return normalized;
}

export function TransactionForm({
  title,
  description,
  submitLabel,
  loadingLabel,
  action,
  onSuccess,
  onUnavailable,
}: TransactionFormProps) {
  const uid = useId();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeAmount(amount);
    if (normalized === null) {
      setError("Informe um valor maior que zero, com até duas casas decimais.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await action(normalized, note.trim());
      setAmount("");
      setNote("");
      await onSuccess();
    } catch (erro) {
      if (erro instanceof ApiUnavailableError) {
        onUnavailable(errorMessage(erro));
      } else {
        setError(errorMessage(erro));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        <TextField
          id={`${uid}-amount`}
          label="Valor (R$)"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          autoComplete="off"
          required
        />
        <TextField
          id={`${uid}-description`}
          label="Descrição (opcional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="ex.: Salário de junho"
          maxLength={255}
        />
        <Button type="submit" loading={loading}>
          {loading ? loadingLabel : submitLabel}
        </Button>
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </Card>
  );
}
