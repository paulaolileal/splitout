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
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
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

  // "exclusive" is just "equal" over a single-participant `sharedWith` —
  // same tab, same distribution logic, only the editor UI differs.
  if (expense.splitType === "equal" || expense.splitType === "exclusive") {
    const ids = expense.sharedWith;
    const parts = distribute(
      expense.totalAmount,
      ids.map(() => 1),
    );
    ids.forEach((id, i) => add(id, parts[i] ?? 0));
    return out;
  }

  if (expense.customMode === "percentage") {
    const active = expense.percentages.filter((p) => p.percent > 0);
    const parts = distribute(
      expense.totalAmount,
      active.map((p) => p.percent),
    );
    active.forEach((p, i) => add(p.participantId, parts[i] ?? 0));
    return out;
  }

  for (const a of expense.allocations) add(a.participantId, a.amount);
  return out;
}

/** Sum of what the split currently covers — used for validation. */
export function splitTotal(expense: Expense): number {
  if (expense.splitType !== "custom") return expense.totalAmount;
  if (expense.customMode === "percentage") {
    const percentSum = expense.percentages.reduce((a, p) => a + p.percent, 0);
    return Math.round((expense.totalAmount * percentSum) / 100);
  }
  return expense.allocations.reduce((a, i) => a + i.amount, 0);
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
 * Direct pairwise debts derived straight from each expense's allocation —
 * "who owes whom, and for what" — before any netting. Debts are aggregated
 * across every expense that shares the same (debtor, creditor) pair.
 */
function pairwiseDebts(party: Party): Map<string, Map<string, number>> {
  const debts = new Map<string, Map<string, number>>();
  const add = (from: string, to: string, amount: number) => {
    if (from === to || amount <= 0) return;
    const owedToOthers = debts.get(from) ?? new Map<string, number>();
    owedToOthers.set(to, (owedToOthers.get(to) ?? 0) + amount);
    debts.set(from, owedToOthers);
  };
  for (const e of party.expenses) {
    const alloc = allocateExpense(e);
    for (const [participantId, amount] of Object.entries(alloc)) {
      add(participantId, e.paidBy, amount);
    }
  }
  return debts;
}

/**
 * Settles each pair of participants independently — nets debts only between
 * the *same* two people (e.g. "Mel owes Paula 10" and "Paula owes Mel 4"
 * collapse into a single "Mel owes Paula 6" transfer), and never routes a
 * debt through an unrelated third person the way a global min-transfer
 * matching (biggest debtor vs. biggest creditor by net balance) would.
 *
 * That global approach produces a technically balanced result but can tell
 * someone to pay a person they never split an expense with — every transfer
 * here stays traceable back to the expenses that produced it.
 */
export function settle(party: Party): Transfer[] {
  const debts = pairwiseDebts(party);
  const transfers: Transfer[] = [];
  const settledPairs = new Set<string>();

  for (const [from, owedToOthers] of debts) {
    for (const to of owedToOthers.keys()) {
      const pairKey = [from, to].sort().join("::");
      if (settledPairs.has(pairKey)) continue;
      settledPairs.add(pairKey);

      const forward = debts.get(from)?.get(to) ?? 0;
      const backward = debts.get(to)?.get(from) ?? 0;
      const net = forward - backward;
      if (net > 0) transfers.push({ from, to, amount: net });
      else if (net < 0) transfers.push({ from: to, to: from, amount: -net });
    }
  }

  return transfers;
}

export function settlementFor(party: Party) {
  return { balances: computeBalances(party), transfers: settle(party) };
}
