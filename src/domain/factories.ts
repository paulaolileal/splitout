import type { Expense, Participant, Party } from "./types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createPartyObject(name: string, emoji: string, date: string): Party {
  const now = Date.now();
  return {
    id: uid(),
    name,
    emoji,
    date,
    participants: [],
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function newParticipant(name: string): Participant {
  return { id: uid(), name: name.trim() };
}

export function newExpense(paidBy: string, sharedWith: string[]): Expense {
  return {
    id: uid(),
    description: "",
    emoji: "🧾",
    totalAmount: 0,
    paidBy,
    splitType: "equal",
    sharedWith,
    items: [],
    allocations: [],
    weights: [],
  };
}
