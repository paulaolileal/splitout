import type { Party } from "./types";

/**
 * Contract every backend must implement. UI/hooks depend only on this
 * interface, never on `infrastructure` directly — see the layer dependency
 * rule in CLAUDE.md. Today the only implementation is `GoogleSheetsRepository`
 * (`src/infrastructure/google/GoogleSheetsRepository.ts`).
 */
export interface PartyRepository {
  listParties(): Promise<Party[]>;
  getParty(id: string): Promise<Party | null>;
  /** Persists the whole party aggregate (participants + expenses included). */
  saveParty(party: Party): Promise<void>;
  deleteParty(id: string): Promise<void>;
}
