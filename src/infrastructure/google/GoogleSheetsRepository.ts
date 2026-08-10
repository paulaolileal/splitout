/**
 * Google Sheets implementation of `PartyRepository` (src/domain/repository.ts).
 *
 * Strategy — "whole-table overwrite": every read fetches all seven tabs in a
 * single `values:batchGet` and reassembles the full `Party[]` graph in
 * memory; every write (`saveParty`/`deleteParty`) reassembles that same
 * `Party[]` graph with the mutation applied, then rewrites the seven tabs
 * from scratch (`values:batchClear` followed by `values:batchUpdate`).
 *
 * Clearing before writing is what makes this safe: a plain `values.update`
 * only overwrites the cells inside the given range and would leave stale
 * rows behind whenever the new content is shorter than the old one (e.g.
 * removing a participant or an expense item). Clearing first avoids having
 * to track row indices per entity, at the cost of touching every party's
 * rows on every save — acceptable for this app's data volume (see
 * CLAUDE.md's "last-write-wins" note on concurrent edits).
 */

import type { PartyRepository } from "@/domain/repository";
import type {
  Allocation,
  Expense,
  ExpenseItem,
  Participant,
  Party,
  SplitType,
  Weight,
} from "@/domain/types";
import { googleApiFetch } from "./googleApiFetch";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

const SHEETS = {
  parties: "parties",
  participants: "participants",
  expenses: "expenses",
  sharedWith: "expense_shared_with",
  items: "expense_items",
  allocations: "expense_allocations",
  weights: "expense_weights",
} as const;

const ALL_RANGES = Object.values(SHEETS);

interface PartyRow {
  party_id: string;
  nome: string;
  emoji: string;
  data: string;
  criado_em: string;
  atualizado_em: string;
}

interface ParticipantRow {
  participant_id: string;
  party_id: string;
  nome: string;
}

interface ExpenseRow {
  expense_id: string;
  party_id: string;
  descricao: string;
  emoji: string;
  valor_total_centavos: string;
  paid_by: string;
  split_type: string;
  ordem: string;
}

interface SharedWithRow {
  expense_id: string;
  participant_id: string;
}

interface ItemRow {
  item_id: string;
  expense_id: string;
  descricao: string;
  valor_centavos: string;
  participant_ids: string;
}

interface AllocationRow {
  expense_id: string;
  participant_id: string;
  valor_centavos: string;
}

interface WeightRow {
  expense_id: string;
  participant_id: string;
  peso: string;
}

interface AllRows {
  [SHEETS.parties]: PartyRow[];
  [SHEETS.participants]: ParticipantRow[];
  [SHEETS.expenses]: ExpenseRow[];
  [SHEETS.sharedWith]: SharedWithRow[];
  [SHEETS.items]: ItemRow[];
  [SHEETS.allocations]: AllocationRow[];
  [SHEETS.weights]: WeightRow[];
}

/** Turns a raw `[header, ...rows]` grid into typed records keyed by the
 * (trimmed) header row — sheet cells often carry stray whitespace from
 * manual edits/paste. Missing cells become `""`, never `undefined`. */
function rowsToRecords<T>(rows: string[][]): T[] {
  if (rows.length === 0) return [];
  const [headerRow, ...body] = rows;
  const headers = (headerRow ?? []).map((h) => h.trim());
  return body.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj as T;
  });
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
}

export class GoogleSheetsRepository implements PartyRepository {
  constructor(private readonly cfg: GoogleSheetsConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    return googleApiFetch<T>(`${API}/${this.cfg.spreadsheetId}${path}`, {
      ...init,
      apiLabel: "Sheets API",
    });
  }

  // ---- read ---------------------------------------------------------

  private async readAllRows(): Promise<AllRows> {
    const query = ALL_RANGES.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
    const data = await this.request<{ valueRanges: { range: string; values?: string[][] }[] }>(
      `/values:batchGet?${query}`,
    );
    const byRange = new Map(data.valueRanges.map((vr) => [vr.range, vr.values ?? []]));
    return {
      [SHEETS.parties]: rowsToRecords<PartyRow>(byRange.get(SHEETS.parties) ?? []),
      [SHEETS.participants]: rowsToRecords<ParticipantRow>(byRange.get(SHEETS.participants) ?? []),
      [SHEETS.expenses]: rowsToRecords<ExpenseRow>(byRange.get(SHEETS.expenses) ?? []),
      [SHEETS.sharedWith]: rowsToRecords<SharedWithRow>(byRange.get(SHEETS.sharedWith) ?? []),
      [SHEETS.items]: rowsToRecords<ItemRow>(byRange.get(SHEETS.items) ?? []),
      [SHEETS.allocations]: rowsToRecords<AllocationRow>(byRange.get(SHEETS.allocations) ?? []),
      [SHEETS.weights]: rowsToRecords<WeightRow>(byRange.get(SHEETS.weights) ?? []),
    };
  }

  private assembleParties(rows: AllRows): Party[] {
    const participantsByParty = new Map<string, Participant[]>();
    for (const r of rows[SHEETS.participants]) {
      if (!r.participant_id || !r.party_id) continue;
      const list = participantsByParty.get(r.party_id) ?? [];
      list.push({ id: r.participant_id, name: r.nome });
      participantsByParty.set(r.party_id, list);
    }

    const sharedWithByExpense = new Map<string, string[]>();
    for (const r of rows[SHEETS.sharedWith]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = sharedWithByExpense.get(r.expense_id) ?? [];
      list.push(r.participant_id);
      sharedWithByExpense.set(r.expense_id, list);
    }

    const itemsByExpense = new Map<string, ExpenseItem[]>();
    for (const r of rows[SHEETS.items]) {
      if (!r.item_id || !r.expense_id) continue;
      const list = itemsByExpense.get(r.expense_id) ?? [];
      list.push({
        id: r.item_id,
        description: r.descricao,
        amount: Number(r.valor_centavos) || 0,
        participantIds: r.participant_ids.split(",").filter(Boolean),
      });
      itemsByExpense.set(r.expense_id, list);
    }

    const allocationsByExpense = new Map<string, Allocation[]>();
    for (const r of rows[SHEETS.allocations]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = allocationsByExpense.get(r.expense_id) ?? [];
      list.push({ participantId: r.participant_id, amount: Number(r.valor_centavos) || 0 });
      allocationsByExpense.set(r.expense_id, list);
    }

    const weightsByExpense = new Map<string, Weight[]>();
    for (const r of rows[SHEETS.weights]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = weightsByExpense.get(r.expense_id) ?? [];
      list.push({ participantId: r.participant_id, weight: Number(r.peso) || 0 });
      weightsByExpense.set(r.expense_id, list);
    }

    const expensesByParty = new Map<string, Expense[]>();
    const expenseRows = [...rows[SHEETS.expenses]].sort(
      (a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0),
    );
    for (const r of expenseRows) {
      if (!r.expense_id || !r.party_id) continue;
      const expense: Expense = {
        id: r.expense_id,
        description: r.descricao,
        emoji: r.emoji || "🧾",
        totalAmount: Number(r.valor_total_centavos) || 0,
        paidBy: r.paid_by,
        splitType: (r.split_type as SplitType) || "equal",
        sharedWith: sharedWithByExpense.get(r.expense_id) ?? [],
        items: itemsByExpense.get(r.expense_id) ?? [],
        allocations: allocationsByExpense.get(r.expense_id) ?? [],
        weights: weightsByExpense.get(r.expense_id) ?? [],
      };
      const list = expensesByParty.get(r.party_id) ?? [];
      list.push(expense);
      expensesByParty.set(r.party_id, list);
    }

    return rows[SHEETS.parties]
      .filter((r) => !!r.party_id)
      .map((r) => ({
        id: r.party_id,
        name: r.nome,
        emoji: r.emoji || "🎉",
        date: r.data,
        participants: participantsByParty.get(r.party_id) ?? [],
        expenses: expensesByParty.get(r.party_id) ?? [],
        createdAt: Number(r.criado_em) || 0,
        updatedAt: Number(r.atualizado_em) || 0,
      }));
  }

  // ---- write ----------------------------------------------------------

  private serializeParties(parties: Party[]): Record<string, (string | number)[][]> {
    const partiesRows: (string | number)[][] = [];
    const participantsRows: (string | number)[][] = [];
    const expensesRows: (string | number)[][] = [];
    const sharedWithRows: (string | number)[][] = [];
    const itemsRows: (string | number)[][] = [];
    const allocationsRows: (string | number)[][] = [];
    const weightsRows: (string | number)[][] = [];

    for (const party of parties) {
      partiesRows.push([
        party.id,
        party.name,
        party.emoji,
        party.date,
        party.createdAt,
        party.updatedAt,
      ]);
      for (const p of party.participants) {
        participantsRows.push([p.id, party.id, p.name]);
      }
      party.expenses.forEach((e, ordem) => {
        expensesRows.push([
          e.id,
          party.id,
          e.description,
          e.emoji,
          e.totalAmount,
          e.paidBy,
          e.splitType,
          ordem,
        ]);
        for (const pid of e.sharedWith) sharedWithRows.push([e.id, pid]);
        for (const item of e.items) {
          itemsRows.push([
            item.id,
            e.id,
            item.description,
            item.amount,
            item.participantIds.join(","),
          ]);
        }
        for (const a of e.allocations) allocationsRows.push([e.id, a.participantId, a.amount]);
        for (const w of e.weights) weightsRows.push([e.id, w.participantId, w.weight]);
      });
    }

    const withHeader = (range: string, rows: (string | number)[][]) => [HEADERS[range]!, ...rows];

    return {
      [SHEETS.parties]: withHeader(SHEETS.parties, partiesRows),
      [SHEETS.participants]: withHeader(SHEETS.participants, participantsRows),
      [SHEETS.expenses]: withHeader(SHEETS.expenses, expensesRows),
      [SHEETS.sharedWith]: withHeader(SHEETS.sharedWith, sharedWithRows),
      [SHEETS.items]: withHeader(SHEETS.items, itemsRows),
      [SHEETS.allocations]: withHeader(SHEETS.allocations, allocationsRows),
      [SHEETS.weights]: withHeader(SHEETS.weights, weightsRows),
    };
  }

  private async writeAll(parties: Party[]): Promise<void> {
    const serialized = this.serializeParties(parties);

    await this.request("/values:batchClear", {
      method: "POST",
      body: JSON.stringify({ ranges: ALL_RANGES }),
    });

    await this.request("/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: ALL_RANGES.map((range) => ({ range, values: serialized[range] })),
      }),
    });
  }

  // ---- PartyRepository ------------------------------------------------

  async listParties(): Promise<Party[]> {
    const rows = await this.readAllRows();
    return this.assembleParties(rows).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getParty(id: string): Promise<Party | null> {
    const rows = await this.readAllRows();
    return this.assembleParties(rows).find((p) => p.id === id) ?? null;
  }

  async saveParty(party: Party): Promise<void> {
    const rows = await this.readAllRows();
    const all = this.assembleParties(rows);
    const next = { ...party, updatedAt: Date.now() };
    const index = all.findIndex((p) => p.id === party.id);
    if (index >= 0) all[index] = next;
    else all.push(next);
    await this.writeAll(all);
  }

  async deleteParty(id: string): Promise<void> {
    const rows = await this.readAllRows();
    const all = this.assembleParties(rows).filter((p) => p.id !== id);
    await this.writeAll(all);
  }
}

const HEADERS: Record<string, string[]> = {
  [SHEETS.parties]: ["party_id", "nome", "emoji", "data", "criado_em", "atualizado_em"],
  [SHEETS.participants]: ["participant_id", "party_id", "nome"],
  [SHEETS.expenses]: [
    "expense_id",
    "party_id",
    "descricao",
    "emoji",
    "valor_total_centavos",
    "paid_by",
    "split_type",
    "ordem",
  ],
  [SHEETS.sharedWith]: ["expense_id", "participant_id"],
  [SHEETS.items]: ["item_id", "expense_id", "descricao", "valor_centavos", "participant_ids"],
  [SHEETS.allocations]: ["expense_id", "participant_id", "valor_centavos"],
  [SHEETS.weights]: ["expense_id", "participant_id", "peso"],
};
