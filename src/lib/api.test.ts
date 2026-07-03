/**
 * Testes da lógica de timeout/retry do cliente da API, com fetch e sleep
 * fakes injetados via `createRequester` — sem rede nem timers reais
 * (exceto o teste de timeout, que usa fake timers do vitest).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  ApiUnavailableError,
  createRequester,
  type RequesterDeps,
} from "./api";

interface Harness {
  deps: RequesterDeps;
  fetchCalls: RequestInit[];
  sleeps: number[];
  retryEvents: string[];
}

/**
 * Monta as dependências fakes: `respostas` é consumida em ordem a cada
 * chamada de fetch — um `Error` rejeita (falha de rede), um `Response`
 * resolve. O sleep é instantâneo e só registra o backoff pedido.
 */
function makeHarness(respostas: Array<Response | Error>): Harness {
  const fetchCalls: RequestInit[] = [];
  const sleeps: number[] = [];
  const retryEvents: string[] = [];

  const deps: RequesterDeps = {
    fetchImpl: (_input, init) => {
      fetchCalls.push(init ?? {});
      const proxima = respostas.shift();
      if (proxima === undefined) {
        throw new Error("fetch fake chamado mais vezes que o esperado");
      }
      return proxima instanceof Error
        ? Promise.reject(proxima)
        : Promise.resolve(proxima);
    },
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    onRetryStart: () => retryEvents.push("start"),
    onRetryEnd: () => retryEvents.push("end"),
  };

  return { deps, fetchCalls, sleeps, retryEvents };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const networkError = () => new TypeError("fetch failed");

afterEach(() => {
  vi.useRealTimers();
});

describe("createRequester", () => {
  it("GET devolve o JSON na primeira tentativa, sem retry", async () => {
    const harness = makeHarness([jsonResponse({ balance: "10.00" })]);
    const request = createRequester(harness.deps);

    const wallet = await request<{ balance: string }>("/wallets/abc");

    expect(wallet).toEqual({ balance: "10.00" });
    expect(harness.fetchCalls).toHaveLength(1);
    expect(harness.sleeps).toEqual([]);
    expect(harness.retryEvents).toEqual([]);
  });

  it("GET refaz com backoff após falha de rede e sinaliza a reconexão", async () => {
    const harness = makeHarness([
      networkError(),
      networkError(),
      jsonResponse({ balance: "10.00" }),
    ]);
    const request = createRequester(harness.deps);

    const wallet = await request<{ balance: string }>("/wallets/abc");

    expect(wallet).toEqual({ balance: "10.00" });
    expect(harness.fetchCalls).toHaveLength(3);
    expect(harness.sleeps).toEqual([2_000, 5_000]);
    expect(harness.retryEvents).toEqual(["start", "end"]);
  });

  it("GET esgota os retries e lança ApiUnavailableError", async () => {
    const harness = makeHarness([
      networkError(),
      networkError(),
      networkError(),
    ]);
    const request = createRequester(harness.deps);

    await expect(request("/wallets/abc")).rejects.toBeInstanceOf(
      ApiUnavailableError,
    );
    expect(harness.fetchCalls).toHaveLength(3);
    expect(harness.sleeps).toEqual([2_000, 5_000]);
    expect(harness.retryEvents).toEqual(["start", "end"]);
  });

  it("POST nunca sofre retry em falha de rede", async () => {
    const harness = makeHarness([networkError()]);
    const request = createRequester(harness.deps);

    await expect(
      request("/wallets", { method: "POST", body: "{}" }),
    ).rejects.toBeInstanceOf(ApiUnavailableError);
    expect(harness.fetchCalls).toHaveLength(1);
    expect(harness.sleeps).toEqual([]);
    expect(harness.retryEvents).toEqual([]);
  });

  it("erro HTTP vira ApiError com o detail e não dispara retry", async () => {
    const harness = makeHarness([
      jsonResponse({ detail: "Saldo insuficiente." }, 409),
    ]);
    const request = createRequester(harness.deps);

    const erro = await request("/wallets/abc").catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).status).toBe(409);
    expect((erro as ApiError).detail).toBe("Saldo insuficiente.");
    expect(harness.fetchCalls).toHaveLength(1);
    expect(harness.retryEvents).toEqual([]);
  });

  it("204 No Content resolve como undefined", async () => {
    const harness = makeHarness([new Response(null, { status: 204 })]);
    const request = createRequester(harness.deps);

    await expect(
      request("/wallets/abc/deposits", { method: "POST", body: "{}" }),
    ).resolves.toBeUndefined();
  });

  it("aborta por timeout e converte em ApiUnavailableError", async () => {
    vi.useFakeTimers();
    // fetch que nunca resolve sozinho — só rejeita quando o sinal aborta
    const deps: RequesterDeps = {
      fetchImpl: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
      sleep: () => Promise.resolve(),
      onRetryStart: () => {},
      onRetryEnd: () => {},
    };
    const request = createRequester(deps);

    const resultado = request("/wallets", { method: "POST", body: "{}" });
    const verificacao = expect(resultado).rejects.toBeInstanceOf(
      ApiUnavailableError,
    );
    await vi.advanceTimersByTimeAsync(12_000);
    await verificacao;
  });
});
