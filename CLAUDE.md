# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server (http://localhost:8080)
npm run build     # production build (dist/)
npm run preview   # preview the production build
npm run lint      # ESLint
npm run format    # Prettier
npm run test      # Vitest (run once)
npm run test:watch
```

## Architecture

This is a **frontend-only SPA** (React 19 + Vite + TypeScript, React Router v7) for
splitting shared expenses among a group ("rolê"). The backend is Google Sheets —
there is no server of our own. Creating/editing a party requires Google login;
`/r/:payload` and `/exemplo` are the two public, login-free routes (see "Routing"
below). The app is also an installable PWA (`vite-plugin-pwa`, `generateSW`
strategy) — static assets are precached, but `googleapis.com`/`accounts.google.com`
are always `NetworkOnly`: party data never comes from the cache.

### Layer dependency rule

```
presentation → hooks → domain ← infrastructure
                     ↑
              application (repositoryProvider)
```

- **UI and hooks** depend on `domain` types and never import from `infrastructure` directly.
- **`application/repositoryProvider.ts`** is the single decision point: it builds a
  `GoogleSheetsRepository` for the current user's spreadsheet (resolved via
  `spreadsheetStore`, keyed by email) and caches the instance per spreadsheet id.
- Adding a new backend means: create a class implementing `PartyRepository`
  (`src/domain/repository.ts`), then switch the provider — zero UI changes needed.

### Key files

| Path | Role |
| --- | --- |
| `src/domain/types.ts` | `Party`, `Participant`, `Expense`, `ExpenseItem`, `Allocation`, `Weight`, `Balance`, `Transfer` |
| `src/domain/engine.ts` | Pure functions: `allocateExpense` (per `splitType`), `computeBalances`, `settle` (greedy min-transfer settlement), `settlementFor`. Covered by `engine.test.ts` |
| `src/domain/factories.ts` | `uid()`, `createPartyObject`, `newParticipant`, `newExpense` — pure entity constructors |
| `src/domain/share.ts` / `report.ts` | Base64url snapshot encode/decode for the public share link, and `buildSnapshot()` |
| `src/domain/repository.ts` | `PartyRepository` interface — the contract every backend must implement |
| `src/application/repositoryProvider.ts` | Singleton factory — builds/caches the `GoogleSheetsRepository` for the active user's spreadsheet |
| `src/hooks/queries.ts` | TanStack Query hooks: `useParties`, `useParty` (returns `{ party, update }`), `useCreateParty`, `useDeleteParty` |
| `src/store/authStore.ts` | Zustand (persisted, `splitout:auth`): signed-in `UserInfo` (name/email/picture) shown in the UI — **never the token** |
| `src/store/spreadsheetStore.ts` | Zustand (persisted, `splitout:spreadsheets`): maps each user's email to their spreadsheet id |
| `src/services/config.ts` | Reads `VITE_GOOGLE_CLIENT_ID` and the Drive OAuth scope |
| `src/services/googleAuth.ts` | Google Identity Services OAuth flow; access token lives **in memory + sessionStorage only** — never localStorage. `initAuthScheduler()` (called once in `main.tsx`) proactively renews the token before it expires and on tab focus/visibility |
| `src/infrastructure/google/googleApiFetch.ts` | Shared fetch wrapper used by all Google REST clients; ensures a fresh token per call and throws `GoogleAuthError` when silent refresh genuinely fails |
| `src/infrastructure/google/GoogleSheetsRepository.ts` | The only `PartyRepository` implementation — see "Google Sheets schema" and "Write strategy" below |
| `src/infrastructure/google/SheetsInitializer.ts` | Creates a brand-new spreadsheet with the seven required tabs/headers during `/setup` |
| `src/infrastructure/google/DriveApiClient.ts` | Finds/creates the "LealTEK Apps" Drive folder and the user's "Splitout" spreadsheet during `/setup` |
| `src/lib/googleAuthToast.ts` | Persistent "reconnect" toast shown whenever a `GoogleAuthError` bubbles up through React Query's cache |
| `src/presentation/App.tsx` | Route tree (see "Routing") |
| `src/presentation/components/ErrorBoundary.tsx` | App-level render error boundary (React Router v7's `<Routes>` has no built-in `errorElement`) |

### Google Sheets schema

`SheetsInitializer` provisions exactly these seven tabs in a spreadsheet titled
**"Splitout"**, created (or found) inside a Drive folder named **"LealTEK Apps"**
(same pattern as every other LealTEK app — see `src/presentation/pages/SetupPage.tsx`).
This is a normalized schema: `Party` is the aggregate root, `Participant[]` and
`Expense[]` hang off it, and `Expense`'s four split-type arrays each get their own tab.

| Tab | Headers |
| --- | --- |
| `parties` | `party_id, nome, emoji, data, criado_em, atualizado_em` |
| `participants` | `participant_id, party_id, nome` |
| `expenses` | `expense_id, party_id, descricao, emoji, valor_total_centavos, paid_by, split_type, ordem` |
| `expense_shared_with` | `expense_id, participant_id` (used by `splitType: "equal"`) |
| `expense_items` | `item_id, expense_id, descricao, valor_centavos, participant_ids` (used by `"item"`; `participant_ids` is comma-joined) |
| `expense_allocations` | `expense_id, participant_id, valor_centavos` (used by `"custom"`) |
| `expense_weights` | `expense_id, participant_id, peso` (used by `"weight"`) |

Monetary values are integer cents, stored as plain numbers in the sheet
(`valor_total_centavos`, `valor_centavos`). `ordem` preserves expense order
within a party (rewritten as a 0-based index on every save).

### Write strategy — "whole-table overwrite"

`GoogleSheetsRepository` does **not** track row indices per entity. Every
`saveParty`/`deleteParty` call:

1. Reads all seven tabs in one `values:batchGet`.
2. Reassembles the full `Party[]` graph in memory and applies the mutation.
3. Clears all seven tabs (`values:batchClear`) and rewrites them from scratch
   in one `values:batchUpdate`.

Clearing before writing is what makes this safe — a plain `values.update` only
overwrites the cells inside the given range and would leave stale rows behind
whenever the new content is shorter than the old one (e.g. removing a
participant). The cost is touching every party's rows on every save, which is
fine at this app's data volume (a handful of parties, dozens of rows each).

**Known limitation**: there is no optimistic lock — two devices/tabs saving the
same party around the same time will **last-write-wins**, silently dropping
whichever save lands first. Acceptable for the target use case (a group of
friends editing manually, not real-time collaboration). A future improvement
would compare `atualizado_em` before overwriting and surface a conflict.

The public share link (`/r/:payload`) is unaffected by any of this — it's a
static base64url snapshot in the URL (`src/domain/share.ts`), never a live
Sheets read.

### Routing

React Router v7, declarative `<Routes>` (see `src/presentation/App.tsx`).
`ProtectedRoute` (auth) and `SpreadsheetRoute` (has a linked Sheet) guard
everything except the two public routes. Unknown routes redirect to `/404`.

| Path | Page | Access |
| --- | --- | --- |
| `/login` | `LoginPage` | public |
| `/exemplo` | `SamplePage` — read-only demo party, never touches Sheets | public |
| `/r/:payload` | `SharedReportPage` — reads the snapshot from the URL | public, `noindex` |
| `/setup` | `SetupPage` — creates/locates the "Splitout" sheet in "LealTEK Apps" | requires login |
| `/` | `HomePage` — list of parties | requires login + linked sheet |
| `/role/novo` | `NewPartyPage` | requires login + linked sheet |
| `/role/:id` | `PartyPage` | requires login + linked sheet |
| `/role/:id/p/:pid` | `ParticipantReportPage` — generates the share link for one participant | requires login + linked sheet |

### Environment variables

```
VITE_GOOGLE_CLIENT_ID=   # OAuth Client ID (Web application type), required
```

The spreadsheet id is not an env var — it's resolved per user at runtime
(`spreadsheetStore`, populated during `/setup` via the Drive API).

### Deploy e DNS

Deploy alvo: **Vercel** (`vercel.json` já configura build/output/install
commands e o rewrite de SPA). Passos para o domínio customizado
`split.lealtek.com`:

1. No dashboard da Vercel → projeto → **Settings → Domains** → adicionar
   `split.lealtek.com` e seguir o registro DNS exato indicado (normalmente um
   CNAME para `cname.vercel-dns.com`).
2. Criar esse registro no provedor DNS de `lealtek.com`. Se estiver atrás do
   proxy do Cloudflare, considerar "DNS only" durante a emissão do certificado
   SSL da Vercel.
3. **Crítico**: no Google Cloud Console → Credentials → o OAuth Client ID
   usado em `VITE_GOOGLE_CLIENT_ID` → **Authorized JavaScript origins** →
   adicionar `https://split.lealtek.com` (e os domínios de preview da Vercel
   usados em desenvolvimento). Sem isso o login falha silenciosamente nesse
   domínio.

### Testing

Only `src/domain/engine.ts` has automated tests (`engine.test.ts`) — it's the
only module with non-trivial pure logic and no I/O. `GoogleSheetsRepository`/
`googleAuth` are thin wrappers around fetch and are not covered; mocking the
Sheets/Drive/OAuth REST surface would be a reasonable next step if this
project grows a CI pipeline.
