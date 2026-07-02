/**
 * Helpers de formatação para exibição: a API trafega valores monetários
 * como strings decimais e datas como ISO 8601; aqui eles ganham o formato
 * pt-BR usado na UI.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(valor: string): string {
  const numero = Number(valor);
  if (Number.isNaN(numero)) {
    return valor;
  }
  return brl.format(numero);
}

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    return iso;
  }
  return dataHora.format(data);
}
