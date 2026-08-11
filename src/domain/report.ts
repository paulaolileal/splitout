import { settlementFor } from "./engine";
import { formatBRL } from "./format";
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

/** The share text for one participant's individual settlement — same
 * message used both on `ParticipantReportPage` (with the public link) and
 * inside `WhatsAppShareModal` (individual mode), so they never diverge. */
export function buildIndividualShareText(snapshot: ShareSnapshot): string {
  const toPay = snapshot.pay.reduce((a, l) => a + l.a, 0);
  const toGet = snapshot.get.reduce((a, l) => a + l.a, 0);
  return `💸 O acerto de ${snapshot.n} no rolê "${snapshot.p}" ficou em ${formatBRL(
    toPay || toGet,
  )}. Veja os detalhes no Splitout.`;
}

/** The group share text — every transfer in the settlement, meant for
 * pasting into a WhatsApp group (no public link, unlike the individual
 * share, since there's no per-group snapshot). */
export function buildGroupShareText(party: Party): string {
  const { transfers } = settlementFor(party);
  if (transfers.length === 0) {
    return `🎉 Acerto do rolê "${party.name}": está tudo certo, ninguém deve nada!`;
  }
  const nameOf = (id: string) => party.participants.find((p) => p.id === id)?.name ?? "?";
  const lines = transfers.map(
    (t) => `• ${nameOf(t.from)} paga ${formatBRL(t.amount)} para ${nameOf(t.to)}`,
  );
  return `💸 Acerto do rolê "${party.name}":\n${lines.join("\n")}`;
}
