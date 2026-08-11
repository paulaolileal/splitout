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
import type { Expense, Party } from "./types";

function baseExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    description: "Despesa",
    emoji: "🧾",
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
      emoji: "🎉",
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
  it("produces no transfers when everyone is already even", () => {
    expect(
      settle([
        { participantId: "a", paid: 50, owed: 50, balance: 0 },
        { participantId: "b", paid: 50, owed: 50, balance: 0 },
      ]),
    ).toEqual([]);
  });

  it("matches the biggest debtor with the biggest creditor and the transfers close every balance", () => {
    const balances = [
      { participantId: "a", paid: 0, owed: 0, balance: -60 },
      { participantId: "b", paid: 0, owed: 0, balance: -10 },
      { participantId: "c", paid: 0, owed: 0, balance: 70 },
    ];
    const transfers = settle(balances);
    const net: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (const t of transfers) {
      net[t.from] = (net[t.from] ?? 0) - t.amount;
      net[t.to] = (net[t.to] ?? 0) + t.amount;
    }
    for (const b of balances) expect(net[b.participantId]).toBe(b.balance);
    // Greedy matching should settle 2 debtors against 1 creditor in 2 transfers, not more.
    expect(transfers.length).toBe(2);
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
