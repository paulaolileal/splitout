import { googleApiFetch } from "./googleApiFetch";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

interface SheetSpec {
  title: string;
  headers: string[];
}

/**
 * Normalized schema for the Party aggregate (Party -> Participant[] +
 * Expense[] -> Allocation[]/Percentage[]), plus the party-independent
 * `people` registry. See CLAUDE.md for the full column reference and the
 * "whole-table overwrite" write strategy that reads/writes the six Party
 * tabs together in `GoogleSheetsRepository` — `people` is read/written in
 * isolation since it doesn't belong to any single party.
 */
export const SHEET_SPECS: SheetSpec[] = [
  {
    title: "parties",
    headers: ["party_id", "nome", "emoji", "data", "criado_em", "atualizado_em"],
  },
  {
    title: "participants",
    headers: ["participant_id", "party_id", "nome", "telefone", "chave_pix"],
  },
  {
    title: "expenses",
    headers: [
      "expense_id",
      "party_id",
      "descricao",
      "emoji",
      "valor_total_centavos",
      "paid_by",
      "split_type",
      "custom_mode",
      "ordem",
    ],
  },
  {
    title: "expense_shared_with",
    headers: ["expense_id", "participant_id"],
  },
  {
    title: "expense_allocations",
    headers: ["expense_id", "participant_id", "valor_centavos"],
  },
  {
    title: "expense_percentages",
    headers: ["expense_id", "participant_id", "percentual"],
  },
  {
    title: "people",
    headers: ["person_id", "nome", "telefone", "criado_em", "atualizado_em", "chave_pix"],
  },
];

type CreatedSheet = { properties: { sheetId: number; title: string } };
type CreateResponse = { spreadsheetId: string; sheets: CreatedSheet[] };
type AddSheetReply = {
  replies: { addSheet?: { properties: { title: string; sheetId: number } } }[];
};

export class SheetsInitializer {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    return googleApiFetch<T>(url, { ...init, apiLabel: "Sheets API" });
  }

  async createSpreadsheet(title: string): Promise<string> {
    const created = await this.request<CreateResponse>(SHEETS_API, {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: SHEET_SPECS.map((spec, idx) => ({
          properties: { sheetId: idx, title: spec.title, index: idx },
        })),
      }),
    });

    const { spreadsheetId, sheets } = created;

    const sheetIdMap: Record<string, number> = {};
    for (const s of sheets) {
      sheetIdMap[s.properties.title] = s.properties.sheetId;
    }

    const requests = SHEET_SPECS.map((spec) => ({
      updateCells: {
        range: {
          sheetId: sheetIdMap[spec.title],
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: spec.headers.length,
        },
        rows: [
          {
            values: spec.headers.map((h) => ({
              userEnteredValue: { stringValue: h },
            })),
          },
        ],
        fields: "userEnteredValue",
      },
    }));

    await this.request(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });

    return spreadsheetId;
  }

  async ensureSheets(spreadsheetId: string): Promise<void> {
    type SpreadsheetMeta = { sheets: CreatedSheet[] };
    const meta = await this.request<SpreadsheetMeta>(
      `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`,
    );

    const sheetIdMap = new Map<string, number>(
      meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]),
    );

    const missing = SHEET_SPECS.filter((spec) => !sheetIdMap.has(spec.title));
    if (missing.length > 0) {
      const result = await this.request<AddSheetReply>(
        `${SHEETS_API}/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          body: JSON.stringify({
            requests: missing.map((spec) => ({ addSheet: { properties: { title: spec.title } } })),
          }),
        },
      );
      for (const reply of result.replies) {
        if (reply.addSheet) {
          sheetIdMap.set(reply.addSheet.properties.title, reply.addSheet.properties.sheetId);
        }
      }
    }

    await this.request(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: SHEET_SPECS.map((spec) => ({
          updateCells: {
            range: {
              sheetId: sheetIdMap.get(spec.title)!,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: spec.headers.length,
            },
            rows: [{ values: spec.headers.map((h) => ({ userEnteredValue: { stringValue: h } })) }],
            fields: "userEnteredValue",
          },
        })),
      }),
    });
  }
}
