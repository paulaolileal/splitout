import { describe, expect, it } from "vitest";
import { consolidateParties } from "./consolidate";
import { computeBalances, settle, settlementFor } from "./engine";
import { sampleParty } from "./sample";
import { DEFAULT_EXPENSE_ICON_KEY, DEFAULT_PARTY_ICON_KEY } from "./icons";
import type { Expense, Party } from "./types";

function baseExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    description: "Despesa",
    emoji: DEFAULT_EXPENSE_ICON_KEY,
    totalAmount: 0,
    paidBy: "a",
    splitType: "equal",
    sharedWith: [],
    customMode: "amount",
    allocations: [],
    percentages: [],
    ...overrides,
  };
}

function party(id: string, participantIds: [string, string][], expenses: Expense[]): Party {
  return {
    id,
    name: `Rolê ${id}`,
    emoji: DEFAULT_PARTY_ICON_KEY,
    date: "2026-01-01",
    createdAt: 0,
    updatedAt: 0,
    participants: participantIds.map(([id, name]) => ({ id, name })),
    expenses,
  };
}

function byName(consolidated: Party, name: string): string {
  const found = consolidated.participants.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!found) throw new Error(`participant "${name}" not found in consolidated party`);
  return found.id;
}

describe("consolidateParties", () => {
  it("merges the same person (by normalized name) across different parties", () => {
    const p1 = party(
      "p1",
      [
        ["a", "Paula"],
        ["b", "Mel"],
      ],
      [baseExpense({ id: "e1", totalAmount: 100, paidBy: "a", sharedWith: ["a", "b"] })],
    );
    const p2 = party(
      "p2",
      [
        ["c", " paula "],
        ["d", "Jess"],
      ],
      [baseExpense({ id: "e2", totalAmount: 60, paidBy: "d", sharedWith: ["c", "d"] })],
    );

    const consolidated = consolidateParties([p1, p2]);

    // "Paula" and " paula " collapse into a single participant.
    expect(consolidated.participants).toHaveLength(3);

    const balances = computeBalances(consolidated);
    const paulaId = byName(consolidated, "paula");
    const paula = balances.find((b) => b.participantId === paulaId)!;
    expect(paula.paid).toBe(100);
    expect(paula.owed).toBe(80); // half of e1 (50) + half of e2 (30)
    expect(paula.balance).toBe(20);
  });

  it("never routes a debt through someone who didn't share the expense, across parties (reported bug, cross-party regression)", () => {
    // Same scenario as engine.test.ts's regression test, but the exclusive
    // expenses live in one party and the shared expenses in another, with
    // each party using its own (unrelated) participant ids and casing.
    const partyA = party(
      "pA",
      [
        ["a-paula", "Paula"],
        ["a-mel", "Mel"],
        ["a-jess", "Jess"],
      ],
      [
        baseExpense({
          id: "macarrao",
          totalAmount: 3000,
          paidBy: "a-paula",
          splitType: "exclusive",
          sharedWith: ["a-paula"],
        }),
        baseExpense({
          id: "fricasse",
          totalAmount: 2500,
          paidBy: "a-paula",
          splitType: "exclusive",
          sharedWith: ["a-mel"],
        }),
        baseExpense({
          id: "lanche",
          totalAmount: 4000,
          paidBy: "a-paula",
          splitType: "exclusive",
          sharedWith: ["a-jess"],
        }),
      ],
    );
    const partyB = party(
      "pB",
      [
        ["b-jess", "jess"],
        ["b-mel", "MEL"],
        ["b-arthur", "Arthur"],
        ["b-paula", "paula"],
      ],
      [
        baseExpense({
          id: "coca",
          totalAmount: 1000,
          paidBy: "b-jess",
          sharedWith: ["b-jess", "b-mel", "b-arthur", "b-paula"],
        }),
        baseExpense({
          id: "cinema",
          totalAmount: 10000,
          paidBy: "b-jess",
          sharedWith: ["b-jess", "b-mel", "b-arthur", "b-paula"],
        }),
      ],
    );

    const consolidated = consolidateParties([partyA, partyB]);
    const transfers = settle(consolidated);

    const paulaId = byName(consolidated, "paula");
    const melId = byName(consolidated, "mel");
    const jessId = byName(consolidated, "jess");
    const arthurId = byName(consolidated, "arthur");

    // Arthur never shared anything Paula paid for, so he must never owe her —
    // even after crossing party boundaries.
    expect(transfers.find((t) => t.from === arthurId && t.to === paulaId)).toBeUndefined();
    expect(transfers).toEqual(
      expect.arrayContaining([
        { from: melId, to: paulaId, amount: 2500 },
        { from: melId, to: jessId, amount: 2750 },
        { from: arthurId, to: jessId, amount: 2750 },
        { from: jessId, to: paulaId, amount: 1250 },
      ]),
    );
    expect(transfers.length).toBe(4);
  });

  it("nets reciprocal debts between the same two people even when each debt comes from a different party", () => {
    const p1 = party(
      "p1",
      [
        ["a", "A"],
        ["b", "B"],
      ],
      [baseExpense({ id: "e1", totalAmount: 100, paidBy: "a", sharedWith: ["a", "b"] })],
    );
    const p2 = party(
      "p2",
      [
        ["x", "a"],
        ["y", "b"],
      ],
      [baseExpense({ id: "e2", totalAmount: 40, paidBy: "y", sharedWith: ["x", "y"] })],
    );

    const consolidated = consolidateParties([p1, p2]);
    const transfers = settle(consolidated);
    const aId = byName(consolidated, "a");
    const bId = byName(consolidated, "b");

    // b owes a 50 (half of e1); a owes b 20 (half of e2) -> nets to b owes a 30.
    expect(transfers).toEqual([{ from: bId, to: aId, amount: 30 }]);
  });

  it("keeps a participant that only appears in one of the parties", () => {
    const p1 = party(
      "p1",
      [
        ["a", "A"],
        ["b", "B"],
      ],
      [baseExpense({ id: "e1", totalAmount: 100, paidBy: "a", sharedWith: ["a", "b"] })],
    );
    const p2 = party("p2", [["c", "C"]], []);

    const consolidated = consolidateParties([p1, p2]);
    expect(consolidated.participants).toHaveLength(3);
    const balances = computeBalances(consolidated);
    const cId = byName(consolidated, "c");
    const c = balances.find((b) => b.participantId === cId)!;
    expect(c.paid).toBe(0);
    expect(c.owed).toBe(0);
  });

  it("is a passthrough for a single party (same balances/transfers by name as settlementFor directly)", () => {
    const original = sampleParty();
    const consolidated = consolidateParties([original]);

    expect(consolidated.participants).toHaveLength(original.participants.length);

    const originalResult = settlementFor(original);
    const consolidatedResult = settlementFor(consolidated);

    const originalById = new Map(original.participants.map((p) => [p.id, p.name]));
    const balancesByName = (result: typeof originalResult, names: Map<string, string>) =>
      result.balances
        .map((b) => ({ name: names.get(b.participantId), paid: b.paid, owed: b.owed }))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const consolidatedById = new Map(consolidated.participants.map((p) => [p.id, p.name]));

    expect(balancesByName(consolidatedResult, consolidatedById)).toEqual(
      balancesByName(originalResult, originalById),
    );

    const transfersByName = (
      transfers: typeof originalResult.transfers,
      names: Map<string, string>,
    ) =>
      transfers
        .map((t) => ({ from: names.get(t.from), to: names.get(t.to), amount: t.amount }))
        .sort((a, b) => (a.from ?? "").localeCompare(b.from ?? ""));

    expect(transfersByName(consolidatedResult.transfers, consolidatedById)).toEqual(
      transfersByName(originalResult.transfers, originalById),
    );
  });

  it("does not throw and returns empty lists for an empty input", () => {
    const consolidated = consolidateParties([]);
    expect(consolidated.participants).toEqual([]);
    expect(consolidated.expenses).toEqual([]);
    expect(consolidated.sources).toEqual([]);
  });

  it("records one source entry per input party, in order, with name and emoji", () => {
    const p1 = party("p1", [["a", "A"]], []);
    const p2 = party("p2", [["b", "B"]], []);
    const consolidated = consolidateParties([p1, p2]);
    expect(consolidated.sources).toEqual([
      { partyId: "p1", partyName: "Rolê p1", emoji: DEFAULT_PARTY_ICON_KEY },
      { partyId: "p2", partyName: "Rolê p2", emoji: DEFAULT_PARTY_ICON_KEY },
    ]);
  });
});
