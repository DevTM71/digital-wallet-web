@AGENTS.md

# digital-wallet-web

Interface web (portfólio) para a [Digital Wallet API](https://github.com/DevTM71/digital-wallet-api) — um backend FastAPI com DDD e Event Sourcing que roda localmente em `http://localhost:8000`. Este projeto consome essa API: abre carteiras, faz depósitos/saques e exibe saldo e extrato.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- A URL da API vem de `NEXT_PUBLIC_API_URL` (ver `.env.local.example`)

## Produção

- Interface web: https://digital-wallet-portfolio.vercel.app (Vercel, com `NEXT_PUBLIC_API_URL` apontando para a API no Render)
- API: https://digital-wallet-api-kh9c.onrender.com (Render free tier — Swagger em `/docs`; cold start raro de ~1 min, o front cobre com timeout + retry em GET); banco PostgreSQL gerenciado (Neon)

## Arquitetura de pastas

- `src/lib` — cliente da API (`api.ts`), tipos do contrato (`types.ts`) e helpers de formatação (`format.ts`)
- `src/components` — componentes React reutilizáveis
- `src/app` — rotas (App Router)

## Convenções

- TypeScript estrito; sem `any`
- Componentes funcionais
- Textos da UI em português (pt-BR)
- Acessibilidade básica: inputs com `label`, atributos `aria` onde fizer sentido
- Visual: uma única cor de destaque (indigo-600) sobre neutros zinc; vermelho/verde/âmbar apenas para estados semânticos (erro/sucesso/aviso)
- `amount`/`balance` trafegam como **strings** (decisão da API para evitar erro de ponto flutuante); a formatação para exibição (BRL, datas) acontece na UI via `src/lib/format.ts`

## Dicas de desenvolvimento

- Backend local: `../digital-wallet-api`, sobe com `docker compose up -d`; se o navegador acusar "API fora do ar" mas `curl` responder, o preflight CORS está falhando por imagem Docker desatualizada → `docker compose up -d --build`
- Lint do Next 16 (`react-hooks/set-state-in-effect`): não chamar setState (nem função que o contenha) sincronamente no corpo de `useEffect` — usar `useSyncExternalStore` para stores externas (ver `src/lib/recents.ts`) ou aplicar estado em callbacks `.then(aplicar, aplicarErro)` (ver `WalletDashboard`)
- Teste manual e2e: `playwright-core` com o Chrome do sistema (`chromium.launch({ channel: "chrome" })`); macOS não tem `timeout` — usar loop com `sleep`
- Screenshots do README ficam em `docs/screenshots/{home,dashboard,statement}.png`; antes de capturar, esconder o badge dev do Next com CSS `nextjs-portal{display:none!important}`

## Versionamento

- Commits pequenos e coesos — nunca misturar mudanças não relacionadas
- Conventional Commits: `feat`, `fix`, `test`, `docs`, `chore`
- Mensagens em inglês, no imperativo (ex.: `feat: add deposit form`)
