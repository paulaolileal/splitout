import type { Balance, Expense, Party, Transfer } from "./types";

/**
 * Distributes `total` cents across `weights` (same order), guaranteeing the
 * sum of the result equals `total` (largest-remainder method).
 */
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || weights.length === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const base = raw.map((v) => Math.floor(v));
  let rest = total - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) {
    const idx = order[k]!.i;
    base[idx] = (base[idx] ?? 0) + 1;
  }
  return base;
}

/** Amount (cents) each participant owes for a single expense. */
export function allocateExpense(expense: Expense): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (id: string, amount: number) => {
    out[id] = (out[id] ?? 0) + amount;
  };

  if (expense.splitType === "equal") {
    const ids = expense.sharedWith;
    const parts = distribute(expense.totalAmount, ids.map(() => 1));
    ids.forEach((id, i) => add(id, parts[i] ?? 0));
    return out;
  }

  if (expense.splitType === "item") {
    for (const item of expense.items) {
      const ids = item.participantIds;
      if (ids.length === 0) continue;
      const parts = distribute(item.amount, ids.map(() => 1));
      ids.forEach((id, i) => add(id, parts[i] ?? 0));
    }
    return out;
  }

  if (expense.splitType === "weight") {
    const active = expense.weights.filter((w) => w.weight > 0);
    const parts = distribute(
      expense.totalAmount,
      active.map((w) => w.weight),
    );
    active.forEach((w, i) => add(w.participantId, parts[i] ?? 0));
    return out;
  }

  for (const a of expense.allocations) add(a.participantId, a.amount);
  return out;
}

/** Sum of what the split currently covers — used for validation. */
export function splitTotal(expense: Expense): number {
  if (expense.splitType === "item")
    return expense.items.reduce((a, i) => a + i.amount, 0);
  if (expense.splitType === "custom")
    return expense.allocations.reduce((a, i) => a + i.amount, 0);
  return expense.totalAmount;
}

export function expenseIsBalanced(expense: Expense): boolean {
  return splitTotal(expense) === expense.totalAmount;
}

export function partyTotal(party: Party): number {
  return party.expenses.reduce((a, e) => a + e.totalAmount, 0);
}

export function computeBalances(party: Party): Balance[] {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const p of party.participants) {
    paid[p.id] = 0;
    owed[p.id] = 0;
  }
  for (const e of party.expenses) {
    if (e.paidBy in paid) paid[e.paidBy] = (paid[e.paidBy] ?? 0) + e.totalAmount;
    const alloc = allocateExpense(e);
    for (const [id, amount] of Object.entries(alloc)) {
      if (id in owed) owed[id] = (owed[id] ?? 0) + amount;
    }
  }
  return party.participants.map((p) => ({
    participantId: p.id,
    paid: paid[p.id] ?? 0,
    owed: owed[p.id] ?? 0,
    balance: (paid[p.id] ?? 0) - (owed[p.id] ?? 0),
  }));
}

/**
 * Greedy settlement: repeatedly match the biggest debtor with the biggest
 * creditor. Produces a small, human-friendly set of transfers.
 */
export function settle(balances: Balance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ id: b.participantId, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ id: b.participantId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const amount = Math.min(d.amount, c.amount);
    if (amount > 0) transfers.push({ from: d.id, to: c.id, amount });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount === 0) i++;
    if (c.amount === 0) j++;
  }
  return transfers;
}

export function settlementFor(party: Party) {
  const balances = computeBalances(party);
  return { balances, transfers: settle(balances) };
}