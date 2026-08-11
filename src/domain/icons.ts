/**
 * Default `@icon-park/react` icon keys for a brand-new party/expense (see
 * `src/presentation/icons/registry.tsx` for the icon-key -> component
 * lookup). Kept here as plain strings, with zero UI dependency, so the
 * domain layer (`factories.ts`) and infrastructure layer
 * (`GoogleSheetsRepository.ts`) can use them without importing from
 * presentation — see the "Layer dependency rule" in CLAUDE.md.
 */
export const DEFAULT_PARTY_ICON_KEY = "fireworks";
export const DEFAULT_EXPENSE_ICON_KEY = "tray";
