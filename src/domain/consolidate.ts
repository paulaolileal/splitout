import type { Allocation, Expense, Participant, Party, Percentage } from "./types";
import { uid } from "./factories";
import { DEFAULT_PARTY_ICON_KEY } from "./icons";

/** Metadata about one of the real parties folded into a `ConsolidatedParty` —
 * display-only, never persisted. */
export interface ConsolidatedSource {
  partyId: string;
  partyName: string;
  emoji: string;
}

/** An in-memory, synthetic `Party` built by merging several real ones — see
 * `consolidateParties`. It is a real `Party` shape (so `settlementFor`,
 * `partyTotal`, `BalanceCard`, `SettlementCard`, `WhatsAppShareModal` all
 * work on it unmodified), plus `sources` recording which real parties fed
 * into it. Never saved through `PartyRepository` — recomputed on every
 * visit from the parties already in the `useParties()` cache.
 */
export interface ConsolidatedParty extends Party {
  sources: ConsolidatedSource[];
}

/** Same identity rule used elsewhere in the app to decide "is this the same
 * person" (`PartyPage.addParticipant`, `PeoplePicker`): trim + lowercase.
 * Note this does **not** strip accents, so "José" and "jose" are treated as
 * different people — consistent with the rest of the app, not a regression. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Rewrites every participant-id reference inside an `Expense` through
 * `remap` — the only thing `allocateExpense`/`computeBalances`/`settle`
 * (`./engine.ts`) ever look at is these ids, so once they're unified the
 * engine runs over the merged expense list with zero changes. */
function remapExpense(expense: Expense, remap: (id: string) => string): Expense {
  return {
    ...expense,
    paidBy: remap(expense.paidBy),
    sharedWith: expense.sharedWith.map(remap),
    allocations: expense.allocations.map((a: Allocation): Allocation => ({
      ...a,
      participantId: remap(a.participantId),
    })),
    percentages: expense.percentages.map((p: Percentage): Percentage => ({
      ...p,
      participantId: remap(p.participantId),
    })),
  };
}

/**
 * Merges several real `Party` objects into one synthetic `ConsolidatedParty`
 * for a combined settlement view ("consolidar rolês").
 *
 * There is no stable person identity across parties today (`Participant.id`
 * is a fresh random id per party, even for the same registered `Person` —
 * see `participantFromPerson`), so participants are deduplicated by
 * normalized name (see `normalizeName`): the first party (in input order)
 * to mention a given name "wins" for the displayed name/phone/Pix key. Every
 * `Expense` from every party is kept, with its participant-id references
 * rewritten onto the unified ids via `remapExpense`.
 *
 * Colliding `expense.id`s across different source parties are harmless here
 * — the engine never indexes by expense id, only iterates the array — but
 * if a consolidated view ever lists individual expenses, key them by
 * `` `${sourcePartyId}:${expense.id}` `` to stay safe.
 */
export function consolidateParties(parties: Party[]): ConsolidatedParty {
  const now = Date.now();
  const idByName = new Map<string, string>(); // normalized name -> unified id
  const rawIdToUnified = new Map<string, string>(); // per-party participant.id -> unified id
  const participants: Participant[] = [];

  for (const party of parties) {
    for (const p of party.participants) {
      const key = normalizeName(p.name);
      let unifiedId = idByName.get(key);
      if (!unifiedId) {
        unifiedId = uid();
        idByName.set(key, unifiedId);
        participants.push({ ...p, id: unifiedId });
      }
      rawIdToUnified.set(p.id, unifiedId);
    }
  }

  const remap = (id: string) => rawIdToUnified.get(id) ?? id;
  const expenses = parties.flatMap((party) => party.expenses.map((e) => remapExpense(e, remap)));
  const sources: ConsolidatedSource[] = parties.map((p) => ({
    partyId: p.id,
    partyName: p.name,
    emoji: p.emoji,
  }));

  return {
    id: `consolidated:${parties
      .map((p) => p.id)
      .sort()
      .join(",")}`,
    name: sources.map((s) => s.partyName).join(" + ") || "Consolidado",
    emoji: DEFAULT_PARTY_ICON_KEY,
    date: parties.reduce(
      (latest, p) => (p.date > latest ? p.date : latest),
      parties[0]?.date ?? "",
    ),
    participants,
    expenses,
    createdAt: now,
    updatedAt: now,
    sources,
  };
}
