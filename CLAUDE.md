@AGENTS.md

# digital-wallet-web

Interface web (portfólio) para a [Digital Wallet API](https://github.com/DevTM71/digital-wallet-api) — um backend FastAPI com DDD e Event Sourcing que roda localmente em `http://localhost:8000`. Este projeto consome essa API: abre carteiras, faz depósitos/saques e exibe saldo e extrato.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- A URL da API vem de `NEXT_PUBLIC_API_URL` (ver `.env.local.example`)

## Arquitetura de pastas

- `src/lib` — cliente da API (`api.ts`), tipos do contrato (`types.ts`) e helpers de formatação (`format.ts`)
- `src/components` — componentes React reutilizáveis
- `src/app` — rotas (App Router)

## Convenções

- TypeScript estrito; sem `any`
- Componentes funcionais
- Textos da UI em português (pt-BR)
- Acessibilidade básica: inputs com `label`, atributos `aria` onde fizer sentido
- `amount`/`balance` trafegam como **strings** (decisão da API para evitar erro de ponto flutuante); a formatação para exibição (BRL, datas) acontece na UI via `src/lib/format.ts`

## Versionamento

- Commits pequenos e coesos — nunca misturar mudanças não relacionadas
- Conventional Commits: `feat`, `fix`, `test`, `docs`, `chore`
- Mensagens em inglês, no imperativo (ex.: `feat: add deposit form`)
