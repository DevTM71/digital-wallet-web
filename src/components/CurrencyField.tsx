import type { ChangeEvent, InputHTMLAttributes } from "react";
import { amountDigits, formatAmountDigits } from "@/lib/format";
import { TextField } from "@/components/TextField";

type CurrencyFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  id: string;
  label: string;
  /** Valor em centavos, apenas dígitos (ex.: "15000" = R$ 150,00). */
  digits: string;
  onDigitsChange: (digits: string) => void;
};

/**
 * Campo monetário com máscara pt-BR: os dígitos entram pela direita
 * ("1" → 0,01; "150" → 1,50) e qualquer caractere não numérico digitado
 * ou colado é descartado.
 */
export function CurrencyField({
  digits,
  onDigitsChange,
  ...props
}: CurrencyFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onDigitsChange(amountDigits(event.target.value));
  }

  return (
    <TextField
      {...props}
      value={formatAmountDigits(digits)}
      onChange={handleChange}
      inputMode="numeric"
      autoComplete="off"
    />
  );
}
