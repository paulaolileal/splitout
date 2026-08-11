import type { Party, Person } from "./types";

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

/**
 * Contract for the reusable, party-independent people registry. A `Person`
 * is only ever copied into a `Participant` (see `participantFromPerson` in
 * `src/domain/factories.ts`) — never referenced live — so this repository
 * doesn't need to know about parties at all.
 */
export interface PersonRepository {
  listPeople(): Promise<Person[]>;
  savePerson(person: Person): Promise<void>;
  deletePerson(id: string): Promise<void>;
}
