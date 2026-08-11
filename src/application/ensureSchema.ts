import { SheetsInitializer } from "@/infrastructure/google/SheetsInitializer";

/**
 * Guarantees a spreadsheet has every tab/header the app currently expects
 * (idempotent — `SheetsInitializer.ensureSheets` only creates what's missing
 * and rewrites header rows). Memoized per `spreadsheetId` so it only hits the
 * Sheets API once per session, not on every navigation.
 *
 * This is the single place that self-heals schema drift for users who linked
 * their spreadsheet before a schema change (e.g. a new tab like `people`) —
 * see `SpreadsheetRoute.tsx`, which awaits this before rendering any page
 * that reads/writes Sheets data, and `SetupPage.tsx`, which calls it for the
 * "found an existing spreadsheet" branch instead of using the initializer
 * directly.
 */

const initializer = new SheetsInitializer();
const cache = new Map<string, Promise<void>>();

export function ensureSchema(spreadsheetId: string): Promise<void> {
  let pending = cache.get(spreadsheetId);
  if (!pending) {
    pending = initializer.ensureSheets(spreadsheetId).catch((error: unknown) => {
      // Let a failed attempt be retried later instead of caching a rejection forever.
      cache.delete(spreadsheetId);
      throw error;
    });
    cache.set(spreadsheetId, pending);
  }
  return pending;
}

export function clearSchemaCache(): void {
  cache.clear();
}
