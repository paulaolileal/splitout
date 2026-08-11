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
- Adding a new backend means: create a class implementing `PartyRepository`/
  `PersonRepository` (`src/domain/repository.ts`), then switch the provider —
  zero UI changes needed.

### Key files

| Path                                                  | Role                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/types.ts`                                 | `Party`, `Participant`, `Expense`, `Allocation`, `Percentage`, `Person`, `Balance`, `Transfer`. `SplitType` is `"equal" \| "exclusive" \| "custom"`; `custom` has a `CustomMode` of `"amount"` or `"percentage"`. `Party.emoji`/`Expense.emoji` are plain `string` fields, but despite the name they no longer hold a raw emoji character — see `src/domain/icons.ts` and "Icons" below                        |
| `src/domain/icons.ts`                                 | `DEFAULT_PARTY_ICON_KEY`/`DEFAULT_EXPENSE_ICON_KEY` — the default `@icon-park/react` icon keys for a brand-new party/expense, kept as plain strings (no UI import) so `factories.ts` and `GoogleSheetsRepository.ts` can use them without breaking the layer dependency rule — see "Icons" below                |
| `src/domain/engine.ts`                                | Pure functions: `allocateExpense` (per `splitType`/`customMode`), `computeBalances`, `settle` (pairwise debt settlement — nets only reciprocal debts between the same two people, never routes a debt through an unrelated third person via net-balance matching), `settlementFor`. Covered by `engine.test.ts` |
| `src/domain/factories.ts`                             | `uid()`, `createPartyObject`, `newParticipant`, `newExpense`, `newPerson`, `participantFromPerson` (copies a registered `Person` — including `pixKey` — into a party-scoped `Participant`, a snapshot, never a live reference) — pure entity constructors                                                       |
| `src/domain/format.ts`                                | `formatBRL`, `formatDate`, `buildWhatsAppLink`, `maskPhoneInput` (progressive `+55 31 9 9999-9999` mask applied as the user types)                                                                                                                                                                              |
| `src/domain/share.ts` / `report.ts`                   | Base64url snapshot encode/decode for the public share link, `buildSnapshot()` (each `pay`/`get` line carries the counterpart's `pixKey`, when set), and the WhatsApp share texts `buildIndividualShareText()`/`buildGroupShareText()` (the latter appends `(Pix: <chave>)` per transfer when the payee has one) |
| `src/domain/repository.ts`                            | `PartyRepository` and `PersonRepository` interfaces — the contracts every backend must implement                                                                                                                                                                                                                |
| `src/application/repositoryProvider.ts`               | Singleton factory — builds/caches the `GoogleSheetsRepository` for the active user's spreadsheet                                                                                                                                                                                                                |
| `src/application/ensureSchema.ts`                     | Memoized per-spreadsheet call to `SheetsInitializer.ensureSheets` — self-heals schema drift (new/renamed tabs) for users who linked their spreadsheet before a schema change. Called from `SpreadsheetRoute` (every page load) and `SetupPage`                                                                  |
| `src/hooks/queries.ts`                                | TanStack Query hooks: `useParties`, `useParty` (returns `{ party, update }`), `useCreateParty`, `useDeleteParty`, `usePeople`, `useSavePerson`, `useDeletePerson`                                                                                                                                               |
| `src/hooks/useEnsureDefaultPerson.ts`                 | Seeds the signed-in Google user as a registered `Person` the first time `/pessoas` loads and no person matches their name — idempotent via a `localStorage` flag keyed by email, so a person the user deliberately deletes afterwards is never recreated                                                        |
| `src/store/authStore.ts`                              | Zustand (persisted, `splitout:auth`): signed-in `UserInfo` (name/email/picture) shown in the UI — **never the token**                                                                                                                                                                                           |
| `src/store/spreadsheetStore.ts`                       | Zustand (persisted, `splitout:spreadsheets`): maps each user's email to their spreadsheet id                                                                                                                                                                                                                    |
| `src/store/themeStore.ts`                             | Zustand (persisted, `splitout:theme`): `"light" \| "dark" \| "system"` preference, default `"system"`                                                                                                                                                                                                           |
| `src/hooks/useTheme.ts`                               | Resolves the active theme (preference + OS `prefers-color-scheme`), toggles the `.dark` class on `<html>`, keeps it in sync with live OS changes, and updates `<meta name="theme-color">`. Called once in `App.tsx`                                                                                             |
| `src/presentation/components/ThemeToggle.tsx`         | Header dropdown (Light/Dark/System) rendered inside `AppShell`                                                                                                                                                                                                                                                  |
| `src/presentation/components/Footer.tsx`              | Footer rendered at the bottom of every screen — `AppShell`, `LoginPage`, `SetupPage`, `NotFoundPage`. Just the "Um produto LealTEK" credit (sized as a real logo, not a watermark) + copyright — see "Branding" below                                                                                           |
| `src/presentation/components/Logo.tsx`                | The "Splitout!" wordmark (badge + name), used in `AppShell`'s header and in `Footer`                                                                                                                                                                                                                            |
| `src/presentation/icons/registry.tsx`                 | Catalogue of `@icon-park/react` "multi-color" icons that back `Party.emoji`/`Expense.emoji`: `FOOD_ICONS`/`SPORT_ICONS`/`ACTIVITY_ICONS` (grouped under `ICON_CATEGORIES`) and `resolveIcon(key)` — unknown keys fall back to the default expense icon instead of rendering as text. See "Icons" below         |
| `src/presentation/components/IconPicker.tsx`          | Popover+Command grid (grouped by `ICON_CATEGORIES`, filterable by label) used by `NewPartyPage`/`ExpenseEditor` to pick a party/expense icon — replaced the old native `<select>` of raw emoji, which couldn't render anything but text inside an `<option>`                                                   |
| `src/presentation/components/PeoplePicker.tsx`        | Popover+Command picker used when adding a participant to a party — pick a registered person or type an ad-hoc name                                                                                                                                                                                              |
| `src/presentation/components/PersonEditor.tsx`        | Small dialog to create/edit/delete a registered person (name, phone with the `maskPhoneInput` mask, and Pix key)                                                                                                                                                                                                |
| `src/presentation/components/WhatsAppShareModal.tsx`  | Dialog to send a settlement summary via WhatsApp — individual (`participant` set, `wa.me/<phone>`) or group (`participant` absent, `wa.me/?text=...`, no fixed recipient)                                                                                                                                       |
| `src/presentation/pages/PeoplePage.tsx` (`/pessoas`)  | CRUD screen for the registered-people directory                                                                                                                                                                                                                                                                 |
| `src/services/config.ts`                              | Reads `VITE_GOOGLE_CLIENT_ID` and the Drive OAuth scope                                                                                                                                                                                                                                                         |
| `src/services/googleAuth.ts`                          | Google Identity Services OAuth flow; access token lives **in memory + sessionStorage only** — never localStorage. `initAuthScheduler()` (called once in `main.tsx`) proactively renews the token before it expires and on tab focus/visibility                                                                  |
| `src/infrastructure/google/googleApiFetch.ts`         | Shared fetch wrapper used by all Google REST clients; ensures a fresh token per call and throws `GoogleAuthError` when silent refresh genuinely fails                                                                                                                                                           |
| `src/infrastructure/google/GoogleSheetsRepository.ts` | The only `PartyRepository`/`PersonRepository` implementation — see "Google Sheets schema" and "Write strategy" below                                                                                                                                                                                            |
| `src/infrastructure/google/SheetsInitializer.ts`      | Creates a brand-new spreadsheet with the seven required tabs/headers during `/setup`; also the idempotent tab/header-repair logic used by `ensureSchema`                                                                                                                                                        |
| `src/infrastructure/google/DriveApiClient.ts`         | Finds/creates the "LealTEK Apps" Drive folder and the user's "Splitout" spreadsheet during `/setup`                                                                                                                                                                                                             |
| `src/lib/googleAuthToast.ts`                          | Persistent "reconnect" toast shown whenever a `GoogleAuthError` bubbles up through React Query's cache                                                                                                                                                                                                          |
| `src/presentation/App.tsx`                            | Route tree (see "Routing")                                                                                                                                                                                                                                                                                      |
| `src/presentation/components/ErrorBoundary.tsx`       | App-level render error boundary (React Router v7's `<Routes>` has no built-in `errorElement`)                                                                                                                                                                                                                   |

### Theming

`src/styles.css` defines a full light/dark oklch token system (Tailwind v4
`@theme inline`, `.dark` class via `@custom-variant dark (&:is(.dark *))`).
Every component consumes semantic classes (`bg-background`, `text-foreground`,
`bg-primary`, ...) — never raw palette classes — so new UI gets dark mode for
free. `useTheme` is the only place that decides whether `.dark` is applied;
`index.html` has an inline pre-hydration script mirroring the same resolution
logic to avoid a light-theme flash. The PWA manifest's `theme_color`/
`background_color` (`vite.config.ts`) stay light-only — the manifest spec has
no `prefers-color-scheme` variant, so that only affects the install splash
screen, not the app itself.

### Icons

`@icon-park/react` (theme `"multi-color"`) replaced raw emoji as the party/
expense icon, the `EmptyState` illustrations, and a handful of inline
status labels (validation warnings, the "you pay"/"you receive" section
headers). `src/presentation/icons/registry.tsx` is the single catalogue:
`FOOD_ICONS`/`SPORT_ICONS`/`ACTIVITY_ICONS` (curated from icon-park's own
`Foods`/`Sports`/`Travel` categories, plus a few `Atividades` extras from
other categories — movies, games, parties), grouped under
`ICON_CATEGORIES` for `IconPicker`, and `resolveIcon(key)` to go from a
stored key back to the icon component anywhere it's rendered
(`HomePage`, `PartyPage`, `SamplePage`, `cards.tsx`'s `ExpenseCard`).

`Party.emoji`/`Expense.emoji` keep their field/column name (no Sheets
schema change), but now store one of `registry.tsx`'s icon-park kebab-case
keys (e.g. `"hamburger"`, `"beer"`, `"taxi"`) instead of a raw emoji
character. **This is a breaking
change with no legacy-emoji compatibility shim by design** — the app was
still pre-launch when this shipped, so old spreadsheet rows with a raw
emoji in the `emoji` column just fall back to `resolveIcon`'s generic
default instead of rendering correctly; there was no need to migrate
existing data.

Lucide (`lucide-react`) is still used everywhere else — functional chrome
icons (back arrows, loading spinners, inline check/alert glyphs, copy/
share buttons, the shadcn primitives under `src/components/ui/**`) were
deliberately left out of this migration; only emoji were in scope.

### Branding — footer & LealTEK credit

`public/lealtek-full.png` is the canonical LealTEK wordmark, shared byte-for-byte
with the sibling LealTEK apps (`meta-board`, `sheet-budget`) — always transparent,
so it renders correctly in both themes without any filter/invert.

`Footer.tsx` is one section used everywhere (`AppShell`, `LoginPage`, `SetupPage`,
`NotFoundPage`) — deliberately not a thin watermark strip, since a tiny
link/logo pairing under-sells the credit. It doesn't repeat the "Splitout!"
wordmark (already in the header on every page) — the LealTEK logo, sized to
actually read as a logo, is the only mark here. Background/border use ordinary
semantic tokens (`bg-muted`, `border-border`), never an inverted color pair —
an inverted band looks like it's ignoring the active theme rather than
adapting to it. It links to `https://lealtek.com`. Keep new full-page screens
(outside `AppShell`) consistent by rendering `<Footer />` as
the last child of a `min-h-screen flex flex-col` wrapper, mirroring
`SetupPage`/`NotFoundPage`.

### Google Sheets schema

`SheetsInitializer` provisions exactly these seven tabs in a spreadsheet titled
**"Splitout"**, created (or found) inside a Drive folder named **"LealTEK Apps"**
(same pattern as every other LealTEK app — see `src/presentation/pages/SetupPage.tsx`).
Six tabs form a normalized schema for the `Party` aggregate root
(`Participant[]`/`Expense[]` hang off it, and `Expense`'s two `custom`-mode
arrays each get their own tab); the seventh, `people`, is an independent
registry not tied to any party (see "Write strategy" below).

| Tab                   | Headers                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parties`             | `party_id, nome, emoji, data, criado_em, atualizado_em`                                                                                                                                             |
| `participants`        | `participant_id, party_id, nome, telefone, chave_pix`                                                                                                                                               |
| `expenses`            | `expense_id, party_id, descricao, emoji, valor_total_centavos, paid_by, split_type, custom_mode, ordem`                                                                                             |
| `expense_shared_with` | `expense_id, participant_id` (used by `splitType: "equal"` **and** `"exclusive"` — exclusive just constrains this to a single row)                                                                  |
| `expense_allocations` | `expense_id, participant_id, valor_centavos` (used by `"custom"` + `customMode: "amount"`)                                                                                                          |
| `expense_percentages` | `expense_id, participant_id, percentual` (used by `"custom"` + `customMode: "percentage"`; 0-100 per row, converted to exact cents via the same largest-remainder `distribute()` used by `"equal"`) |
| `people`              | `person_id, nome, telefone, criado_em, atualizado_em, chave_pix` — the registered-people directory, reusable across every party                                                                     |

Monetary values are integer cents, stored as plain numbers in the sheet
(`valor_total_centavos`, `valor_centavos`). `ordem` preserves expense order
within a party (rewritten as a 0-based index on every save). `telefone` and
`chave_pix` are always optional (empty string when absent). `emoji` (on
`parties`/`expenses`) stores an `@icon-park/react` icon key, not a raw
emoji character — see "Icons" above.

### Write strategy — "whole-table overwrite" (Party) + isolated `people`

`GoogleSheetsRepository` does **not** track row indices per entity. Every
`saveParty`/`deleteParty` call:

1. Reads the six party tabs with a `values.get` call per tab (`readAllRows`, run in
   parallel via `Promise.all`) — deliberately **not** a single multi-range
   `values:batchGet`: the Sheets API echoes each `ValueRange.range` back
   normalized to the data's actual extent (e.g. `"parties!A1:F2"`), never the
   bare sheet name requested, so matching the response to a tab by that
   string always misses and silently yields "no rows" for every tab.
2. Reassembles the full `Party[]` graph in memory and applies the mutation.
3. Clears all six tabs (`values:batchClear`) and rewrites them from scratch
   in one `values:batchUpdate`.

Clearing before writing is what makes this safe — a plain `values.update` only
overwrites the cells inside the given range and would leave stale rows behind
whenever the new content is shorter than the old one (e.g. removing a
participant). The cost is touching every party's rows on every save, which is
fine at this app's data volume (a handful of parties, dozens of rows each).

`people` is read/written in complete isolation from those six tabs
(`listPeople`/`savePerson`/`deletePerson`) — a `Person` doesn't belong to any
party, so a person operation never touches party data and vice versa.

**Known limitation**: there is no optimistic lock — two devices/tabs saving the
same party around the same time will **last-write-wins**, silently dropping
whichever save lands first. Acceptable for the target use case (a group of
friends editing manually, not real-time collaboration). A future improvement
would compare `atualizado_em` before overwriting and surface a conflict.

The public share link (`/r/:payload`) is unaffected by any of this — it's a
static base64url snapshot in the URL (`src/domain/share.ts`), never a live
Sheets read.

**Schema self-heal**: `src/application/ensureSchema.ts` calls
`SheetsInitializer.ensureSheets` (idempotent — creates missing tabs, rewrites
header rows) once per spreadsheet per session. `SpreadsheetRoute` awaits it
before rendering any Sheets-backed page, so users who linked their
spreadsheet before a schema change (e.g. this feature's `people` tab) pick up
new tabs/headers automatically, without going through `/setup` again.

### Routing

React Router v7, declarative `<Routes>` (see `src/presentation/App.tsx`).
`ProtectedRoute` (auth) and `SpreadsheetRoute` (has a linked Sheet) guard
everything except the two public routes. Unknown routes redirect to `/404`.

| Path               | Page                                                                                                                                                                                                            | Access                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `/login`           | `LoginPage`                                                                                                                                                                                                     | public                        |
| `/exemplo`         | `SamplePage` — read-only demo party, never touches Sheets                                                                                                                                                       | public                        |
| `/r/:payload`      | `SharedReportPage` — reads the snapshot from the URL                                                                                                                                                            | public, `noindex`             |
| `/setup`           | `SetupPage` — creates/locates the "Splitout" sheet in "LealTEK Apps"                                                                                                                                            | requires login                |
| `/`                | `HomePage` — list of parties                                                                                                                                                                                    | requires login + linked sheet |
| `/role/novo`       | `NewPartyPage`                                                                                                                                                                                                  | requires login + linked sheet |
| `/role/:id`        | `PartyPage`                                                                                                                                                                                                     | requires login + linked sheet |
| `/role/:id/p/:pid` | `ParticipantReportPage` — generates the share link for one participant, and is where that participant's WhatsApp send lives (`PartyPage`'s balance list only links here — it has no WhatsApp button of its own) | requires login + linked sheet |
| `/pessoas`         | `PeoplePage` — CRUD for the registered-people directory                                                                                                                                                         | requires login + linked sheet |

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
