import { settlementFor } from "./engine";
import type { ShareSnapshot } from "./share";
import type { Party } from "./types";

export function buildSnapshot(party: Party, participantId: string): ShareSnapshot | null {
  const me = party.participants.find((p) => p.id === participantId);
  if (!me) return null;
  const { balances, transfers } = settlementFor(party);
  const balance = balances.find((b) => b.participantId === participantId);
  const nameOf = (id: string) => party.participants.find((p) => p.id === id)?.name ?? "?";

  return {
    v: 1,
    p: party.name,
    e: party.emoji,
    d: party.date,
    n: me.name,
    o: balance?.owed ?? 0,
    q: balance?.paid ?? 0,
    pay: transfers
      .filter((t) => t.from === participantId)
      .map((t) => ({ n: nameOf(t.to), a: t.amount })),
    get: transfers
      .filter((t) => t.to === participantId)
      .map((t) => ({ n: nameOf(t.from), a: t.amount })),
  };
}