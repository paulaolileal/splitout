import type { Party } from "./types";

/** The reference scenario: Shopping / Paula, Mel, Jess / custom split, each
 * person assumes their own fixed amount. Used only by the read-only
 * "/exemplo" demo page — never persisted, never written to Google Sheets. */
export function sampleParty(): Party {
  const paula = { id: "paula", name: "Paula" };
  const mel = { id: "mel", name: "Mel" };
  const jess = { id: "jess", name: "Jess" };
  const now = Date.now();
  return {
    id: "exemplo",
    name: "Shopping",
    emoji: "🍝",
    date: new Date().toISOString().slice(0, 10),
    participants: [paula, mel, jess],
    createdAt: now,
    updatedAt: now,
    expenses: [
      {
        id: "restaurante",
        description: "Restaurante do shopping",
        emoji: "🍝",
        totalAmount: 9000,
        paidBy: paula.id,
        splitType: "custom",
        sharedWith: [paula.id, mel.id, jess.id],
        customMode: "amount",
        percentages: [],
        allocations: [
          { participantId: paula.id, amount: 4000 },
          { participantId: mel.id, amount: 2000 },
          { participantId: jess.id, amount: 3000 },
        ],
      },
    ],
  };
}
