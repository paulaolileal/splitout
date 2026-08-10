import type { Party } from "./types";

/** The reference scenario: Shopping / Paula, Mel, Jess / item split. Used only by the
 * read-only "/exemplo" demo page — never persisted, never written to Google Sheets. */
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
        splitType: "item",
        sharedWith: [paula.id, mel.id, jess.id],
        allocations: [],
        weights: [],
        items: [
          { id: "i1", description: "Macarrão", amount: 4000, participantIds: [paula.id] },
          { id: "i2", description: "Fricassê", amount: 2000, participantIds: [mel.id] },
          { id: "i3", description: "Comida", amount: 3000, participantIds: [jess.id] },
        ],
      },
    ],
  };
}
