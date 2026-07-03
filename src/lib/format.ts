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

/**
 * Máscara do campo monetário: o estado é uma string só de dígitos, em
 * centavos, que entram pela direita ("1" → 0,01; "150" → 1,50). Letras e
 * símbolos digitados ou colados são descartados na extração.
 */

/** Extrai os dígitos do texto digitado, sem zeros à esquerda; limita a 13 dígitos para caber em `Number` sem perda. */
export function amountDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13);
}

const brlDigitos = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Dígitos → texto exibido no input ("12345" → "123,45"; vazio → ""). */
export function formatAmountDigits(digits: string): string {
  if (digits === "") {
    return "";
  }
  return brlDigitos.format(Number(digits) / 100);
}

/** Dígitos → valor no contrato da API ("12345" → "123.45"); null se vazio ou zero. */
export function amountFromDigits(digits: string): string | null {
  const cents = digits.replace(/^0+/, "");
  if (cents === "") {
    return null;
  }
  const reais = cents.length > 2 ? cents.slice(0, -2) : "0";
  const centavos = cents.padStart(2, "0").slice(-2);
  return `${reais}.${centavos}`;
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
