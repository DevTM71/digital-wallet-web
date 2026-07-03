/**
 * Testes da máscara monetária: extração de dígitos do que foi digitado,
 * formatação pt-BR para exibição e conversão para o formato da API.
 */

import { describe, expect, it } from "vitest";
import { amountDigits, amountFromDigits, formatAmountDigits } from "./format";

describe("amountDigits", () => {
  it("descarta letras e símbolos", () => {
    expect(amountDigits("1a2b3!")).toBe("123");
    expect(amountDigits("abc")).toBe("");
  });

  it("aceita valor colado com formatação de moeda", () => {
    expect(amountDigits("R$ 1.234,56")).toBe("123456");
  });

  it("remove zeros à esquerda", () => {
    expect(amountDigits("007")).toBe("7");
    expect(amountDigits("0")).toBe("");
  });

  it("limita a 13 dígitos", () => {
    expect(amountDigits("9".repeat(20))).toBe("9".repeat(13));
  });
});

describe("formatAmountDigits", () => {
  it("vazio exibe vazio (placeholder aparece)", () => {
    expect(formatAmountDigits("")).toBe("");
  });

  it("dígitos entram pela direita, em centavos", () => {
    expect(formatAmountDigits("5")).toBe("0,05");
    expect(formatAmountDigits("50")).toBe("0,50");
    expect(formatAmountDigits("150")).toBe("1,50");
  });

  it("usa separador de milhar pt-BR", () => {
    expect(formatAmountDigits("123456")).toBe("1.234,56");
    expect(formatAmountDigits("100000000")).toBe("1.000.000,00");
  });
});

describe("amountFromDigits", () => {
  it("vazio ou zero é inválido", () => {
    expect(amountFromDigits("")).toBeNull();
    expect(amountFromDigits("0")).toBeNull();
    expect(amountFromDigits("000")).toBeNull();
  });

  it("converte para decimal com ponto e duas casas", () => {
    expect(amountFromDigits("5")).toBe("0.05");
    expect(amountFromDigits("50")).toBe("0.50");
    expect(amountFromDigits("150")).toBe("1.50");
    expect(amountFromDigits("123456")).toBe("1234.56");
  });

  it("não perde precisão com valores grandes", () => {
    expect(amountFromDigits("9999999999999")).toBe("99999999999.99");
  });
});
