import { describe, expect, it } from "vitest";
import {
  allocateExpense,
  computeBalances,
  expenseIsBalanced,
  partyTotal,
  settle,
  settlementFor,
  splitTotal,
} from "./engine";
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

describe("allocateExpense", () => {
  it("splits an 'equal' expense using the largest-remainder method so the sum matches exactly", () => {
    const expense = baseExpense({
      totalAmount: 100,
      splitType: "equal",
      sharedWith: ["a", "b", "c"],
    });
    const alloc = allocateExpense(expense);
    expect(Object.values(alloc).reduce((a, b) => a + b, 0)).toBe(100);
    // 100 / 3 = 33.33... -> two people get 33, one gets 34 (order depends on rounding, but the multiset does)
    expect(Object.values(alloc).sort()).toEqual([33, 33, 34]);
  });

  it("returns an empty allocation when 'equal' has no one selected", () => {
    const expense = baseExpense({ totalAmount: 100, splitType: "equal", sharedWith: [] });
    expect(allocateExpense(expense)).toEqual({});
  });

  it("gives the entire total to the single person on an 'exclusive' expense", () => {
    const expense = baseExpense({ totalAmount: 4500, splitType: "exclusive", sharedWith: ["a"] });
    expect(allocateExpense(expense)).toEqual({ a: 4500 });
  });

  it("uses fixed amounts for a 'custom' expense in 'amount' mode", () => {
    const expense = baseExpense({
      totalAmount: 300,
      splitType: "custom",
      customMode: "amount",
      allocations: [
        { participantId: "a", amount: 100 },
        { participantId: "b", amount: 200 },
      ],
    });
    expect(allocateExpense(expense)).toEqual({ a: 100, b: 200 });
  });

  it("distributes a 'custom' expense in 'percentage' mode proportionally and ignores zero-percent participants", () => {
    const expense = baseExpense({
      totalAmount: 100,
      splitType: "custom",
      customMode: "percentage",
      percentages: [
        { participantId: "a", percent: 75 },
        { participantId: "b", percent: 25 },
        { participantId: "c", percent: 0 },
      ],
    });
    const alloc = allocateExpense(expense);
    expect(alloc["a"]).toBe(75);
    expect(alloc["b"]).toBe(25);
    expect(alloc["c"]).toBeUndefined();
  });
});

describe("splitTotal / expenseIsBalanced", () => {
  it("sums allocation amounts for 'custom'+'amount' splits regardless of totalAmount", () => {
    const expense = baseExpense({
      totalAmount: 100,
      splitType: "custom",
      customMode: "amount",
      allocations: [{ participantId: "a", amount: 40 }],
    });
    expect(splitTotal(expense)).toBe(40);
    expect(expenseIsBalanced(expense)).toBe(false);
  });

  it("is unbalanced for 'custom'+'percentage' splits when percentages don't add up to 100", () => {
    const expense = baseExpense({
      totalAmount: 200,
      splitType: "custom",
      customMode: "percentage",
      percentages: [{ participantId: "a", percent: 40 }],
    });
    expect(splitTotal(expense)).toBe(80);
    expect(expenseIsBalanced(expense)).toBe(false);
  });

  it("is balanced for 'custom'+'percentage' splits when percentages add up to 100", () => {
    const expense = baseExpense({
      totalAmount: 200,
      splitType: "custom",
      customMode: "percentage",
      percentages: [
        { participantId: "a", percent: 60 },
        { participantId: "b", percent: 40 },
      ],
    });
    expect(splitTotal(expense)).toBe(200);
    expect(expenseIsBalanced(expense)).toBe(true);
  });

  it("is balanced for 'equal'/'exclusive' splits as long as totalAmount is set", () => {
    const equal = baseExpense({ totalAmount: 100, splitType: "equal", sharedWith: ["a"] });
    expect(splitTotal(equal)).toBe(100);
    expect(expenseIsBalanced(equal)).toBe(true);

    const exclusive = baseExpense({ totalAmount: 100, splitType: "exclusive", sharedWith: ["a"] });
    expect(splitTotal(exclusive)).toBe(100);
    expect(expenseIsBalanced(exclusive)).toBe(true);
  });
});

describe("computeBalances", () => {
  it("computes paid/owed/balance per participant across multiple payers", () => {
    const party: Party = {
      id: "p1",
      name: "Rolê",
      emoji: DEFAULT_PARTY_ICON_KEY,
      date: "2026-01-01",
      createdAt: 0,
      updatedAt: 0,
      participants: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
      expenses: [
        baseExpense({
          id: "e1",
          totalAmount: 100,
          paidBy: "a",
          splitType: "equal",
          sharedWith: ["a", "b"],
        }),
        baseExpense({
          id: "e2",
          totalAmount: 50,
          paidBy: "b",
          splitType: "equal",
          sharedWith: ["a", "b"],
        }),
      ],
    };
    const balances = computeBalances(party);
    const a = balances.find((b) => b.participantId === "a")!;
    const b = balances.find((b) => b.participantId === "b")!;
    expect(a.paid).toBe(100);
    expect(a.owed).toBe(75);
    expect(a.balance).toBe(25);
    expect(b.paid).toBe(50);
    expect(b.owed).toBe(75);
    expect(b.balance).toBe(-25);
    expect(partyTotal(party)).toBe(150);
  });
});

describe("settle", () => {
  function party(participantIds: string[], expenses: Expense[]): Party {
    return {
      id: "p1",
      name: "Rolê",
      emoji: DEFAULT_PARTY_ICON_KEY,
      date: "2026-01-01",
      createdAt: 0,
      updatedAt: 0,
      participants: participantIds.map((id) => ({ id, name: id })),
      expenses,
    };
  }

  it("produces no transfers when everyone is already even", () => {
    const p = party(
      ["a", "b"],
      [baseExpense({ totalAmount: 100, paidBy: "a", sharedWith: ["a", "b"] })],
    );
    // a paid 100 and owes 50 for the shared expense -> only b owes a.
    expect(settle(p)).toEqual([{ from: "b", to: "a", amount: 50 }]);
  });

  it("nets reciprocal debts between the same two people into a single transfer", () => {
    const p = party(
      ["a", "b"],
      [
        baseExpense({ id: "e1", totalAmount: 100, paidBy: "a", sharedWith: ["a", "b"] }),
        baseExpense({ id: "e2", totalAmount: 40, paidBy: "b", sharedWith: ["a", "b"] }),
      ],
    );
    // b owes a 50 (half of e1); a owes b 20 (half of e2) -> nets to b owes a 30.
    expect(settle(p)).toEqual([{ from: "b", to: "a", amount: 30 }]);
  });

  it("never routes a debt through someone who didn't share the expense (reported bug)", () => {
    // Amounts in cents. Paula paid 30,00 on something only she consumed,
    // 25,00 on something only Mel consumed, and 40,00 on something only Jess
    // consumed. Jess paid 10,00 and 100,00 on two things split equally among
    // Jess, Mel, Arthur and Paula.
    const p = party(
      ["paula", "mel", "jess", "arthur"],
      [
        baseExpense({
          id: "macarrao",
          totalAmount: 3000,
          paidBy: "paula",
          splitType: "exclusive",
          sharedWith: ["paula"],
        }),
        baseExpense({
          id: "fricasse",
          totalAmount: 2500,
          paidBy: "paula",
          splitType: "exclusive",
          sharedWith: ["mel"],
        }),
        baseExpense({
          id: "lanche",
          totalAmount: 4000,
          paidBy: "paula",
          splitType: "exclusive",
          sharedWith: ["jess"],
        }),
        baseExpense({
          id: "coca",
          totalAmount: 1000,
          paidBy: "jess",
          sharedWith: ["jess", "mel", "arthur", "paula"],
        }),
        baseExpense({
          id: "cinema",
          totalAmount: 10000,
          paidBy: "jess",
          sharedWith: ["jess", "mel", "arthur", "paula"],
        }),
      ],
    );
    const transfers = settle(p);
    // Arthur never shared anything Paula paid for, so he must never owe her.
    expect(transfers.find((t) => t.from === "arthur" && t.to === "paula")).toBeUndefined();
    expect(transfers).toEqual(
      expect.arrayContaining([
        { from: "mel", to: "paula", amount: 2500 },
        { from: "mel", to: "jess", amount: 2750 },
        { from: "arthur", to: "jess", amount: 2750 },
        { from: "jess", to: "paula", amount: 1250 },
      ]),
    );
    expect(transfers.length).toBe(4);
  });
});

describe("settlementFor (integration, using the reference sample party)", () => {
  it("matches the documented example: Paula paid 90 for the group, custom-split", () => {
    const party = sampleParty();
    const { balances, transfers } = settlementFor(party);

    const paula = balances.find((b) => b.participantId === "paula")!;
    const mel = balances.find((b) => b.participantId === "mel")!;
    const jess = balances.find((b) => b.participantId === "jess")!;

    expect(paula.paid).toBe(9000);
    expect(paula.owed).toBe(4000);
    expect(paula.balance).toBe(5000);
    expect(mel.owed).toBe(2000);
    expect(mel.balance).toBe(-2000);
    expect(jess.owed).toBe(3000);
    expect(jess.balance).toBe(-3000);

    expect(transfers).toEqual(
      expect.arrayContaining([
        { from: "mel", to: "paula", amount: 2000 },
        { from: "jess", to: "paula", amount: 3000 },
      ]),
    );
  });
});
