# Splitout!

**Divida o rolê. Acerte as contas.**

Splitout é um app/PWA para dividir despesas de rolês, viagens, restaurantes e
qualquer situação em que várias pessoas gastam juntas mas nem sempre pagam
exatamente o que consumiram. Cada participante pode ter consumido uma coisa
diferente, pessoas diferentes podem ter pago as contas, e o Splitout calcula
automaticamente quem deve quanto para quem.

A visão de produto original está preservada em [`docs/product-brief.md`](docs/product-brief.md).

## Stack

- **React 19 + Vite + TypeScript** — SPA pura, sem SSR (o fluxo de login Google
  é 100% client-side, então não há benefício em rodar servidor).
- **React Router v7** — roteamento declarativo.
- **Tailwind CSS v4 + shadcn/ui (Radix)** — UI.
- **TanStack Query** — cache/estado das chamadas ao Google Sheets.
- **Zustand** — estado de autenticação e da planilha ativa.
- **Google Identity Services + Google Sheets API v4 + Drive API v3** — login e
  armazenamento (ver "Google Sheets" abaixo).
- **vite-plugin-pwa** — service worker/instalação como PWA.
- **Vitest** — testes do motor de cálculo (`src/domain/engine.ts`).

Arquitetura em camadas e schema das planilhas documentados em [`CLAUDE.md`](CLAUDE.md).

## Setup local

```sh
npm install
cp .env.example .env.local
npm run dev
```

Você precisa de um **OAuth Client ID** (tipo "Web application") no
[Google Cloud Console](https://console.cloud.google.com/apis/credentials), com
a **Google Sheets API** e a **Google Drive API** habilitadas no projeto. Adicione
a origem local (`http://localhost:5173`) em "Authorized JavaScript origins" e
coloque o Client ID em `VITE_GOOGLE_CLIENT_ID` no `.env.local`. Não é preciso
client secret nem redirect URI — o fluxo é OAuth2 implícito, todo client-side.

## Comandos

```sh
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (dist/)
npm run preview   # serve o build de produção localmente
npm run lint      # ESLint
npm run format    # Prettier
npm run test      # Vitest
```

## Deploy (Vercel)

O projeto já inclui `vercel.json` (rewrite de SPA + build/output/install
commands). Configure a variável de ambiente `VITE_GOOGLE_CLIENT_ID` no projeto
Vercel e adicione cada domínio (produção e previews) em "Authorized JavaScript
origins" no Google Cloud Console — sem isso o login quebra nesse domínio.
Detalhes de domínio customizado (`split.lealtek.com`) em [`CLAUDE.md`](CLAUDE.md#deploy-e-dns).
