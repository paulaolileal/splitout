import type { Expense, Participant, Party, Person } from "./types";

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

export function newParticipant(name: string, phone?: string, pixKey?: string): Participant {
  const trimmedPhone = phone?.trim();
  const trimmedPixKey = pixKey?.trim();
  return {
    id: uid(),
    name: name.trim(),
    ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    ...(trimmedPixKey ? { pixKey: trimmedPixKey } : {}),
  };
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
    customMode: "amount",
    allocations: [],
    percentages: [],
  };
}

export function newPerson(name: string, phone?: string, pixKey?: string): Person {
  const now = Date.now();
  const trimmedPhone = phone?.trim();
  const trimmedPixKey = pixKey?.trim();
  return {
    id: uid(),
    name: name.trim(),
    ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    ...(trimmedPixKey ? { pixKey: trimmedPixKey } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/** Copies a registered person into a brand-new party-scoped participant —
 * a snapshot, not a live reference; editing the person later never changes
 * participants already added to a party. */
export function participantFromPerson(person: Person): Participant {
  return newParticipant(person.name, person.phone, person.pixKey);
}
