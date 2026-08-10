import { useCallback, useEffect, useState } from "react";
import type { Expense, Party, Participant } from "./types";
import { sampleParty } from "./sample";

const KEY = "acerta:parties:v1";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function read(): Party[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = [sampleParty()];
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Party[]) : [];
  } catch {
    return [];
  }
}

function write(parties: Party[]) {
  window.localStorage.setItem(KEY, JSON.stringify(parties));
  window.dispatchEvent(new Event("acerta:change"));
}

export function listParties(): Party[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getParty(id: string): Party | undefined {
  return read().find((p) => p.id === id);
}

export function saveParty(party: Party) {
  const all = read();
  const next = { ...party, updatedAt: Date.now() };
  const index = all.findIndex((p) => p.id === party.id);
  if (index >= 0) all[index] = next;
  else all.push(next);
  write(all);
}

export function deleteParty(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function createParty(name: string, emoji: string, date: string): Party {
  const party: Party = {
    id: uid(),
    name,
    emoji,
    date,
    participants: [],
    expenses: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveParty(party);
  return party;
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

/** Reactive list of parties (client-side only). */
export function useParties(): Party[] | null {
  const [parties, setParties] = useState<Party[] | null>(null);
  useEffect(() => {
    const sync = () => setParties(listParties());
    sync();
    window.addEventListener("acerta:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("acerta:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return parties;
}

/** Reactive single party with an update helper. */
export function useParty(id: string) {
  const [party, setParty] = useState<Party | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setParty(getParty(id) ?? null);
    sync();
    window.addEventListener("acerta:change", sync);
    return () => window.removeEventListener("acerta:change", sync);
  }, [id]);

  const update = useCallback(
    (mutate: (draft: Party) => Party) => {
      const current = getParty(id);
      if (!current) return;
      saveParty(mutate(structuredClone(current)));
    },
    [id],
  );

  return { party, update };
}