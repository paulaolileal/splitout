/**
 * Google Sheets implementation of `PartyRepository` and `PersonRepository`
 * (src/domain/repository.ts).
 *
 * Party strategy — "whole-table overwrite": every read fetches all six party
 * tabs in one `values:batchGet` call and reassembles the full `Party[]`
 * graph in memory; every write (`saveParty`/`deleteParty`) reassembles that
 * same `Party[]` graph
 * with the mutation applied, then rewrites the six tabs from scratch
 * (`values:batchClear` followed by `values:batchUpdate`).
 *
 * Clearing before writing is what makes this safe: a plain `values.update`
 * only overwrites the cells inside the given range and would leave stale
 * rows behind whenever the new content is shorter than the old one (e.g.
 * removing a participant). Clearing first avoids having to track row indices
 * per entity, at the cost of touching every party's rows on every save —
 * acceptable for this app's data volume (see CLAUDE.md's "last-write-wins"
 * note on concurrent edits).
 *
 * People strategy — the `people` tab is a party-independent registry
 * (see `PersonRepository`), so it's read/written in isolation from the six
 * party tabs: a person operation never touches party data and vice versa.
 */

import type { PartyRepository, PersonRepository } from "@/domain/repository";
import type {
  Allocation,
  CustomMode,
  Expense,
  Participant,
  Party,
  Percentage,
  Person,
  SplitType,
} from "@/domain/types";
import { DEFAULT_EXPENSE_ICON_KEY, DEFAULT_PARTY_ICON_KEY } from "@/domain/icons";
import { googleApiFetch } from "./googleApiFetch";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

const SHEETS = {
  parties: "parties",
  participants: "participants",
  expenses: "expenses",
  sharedWith: "expense_shared_with",
  allocations: "expense_allocations",
  percentages: "expense_percentages",
} as const;

const PEOPLE_SHEET = "people";

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
  telefone: string;
  chave_pix: string;
}

interface ExpenseRow {
  expense_id: string;
  party_id: string;
  descricao: string;
  emoji: string;
  valor_total_centavos: string;
  paid_by: string;
  split_type: string;
  custom_mode: string;
  ordem: string;
}

interface SharedWithRow {
  expense_id: string;
  participant_id: string;
}

interface AllocationRow {
  expense_id: string;
  participant_id: string;
  valor_centavos: string;
}

interface PercentageRow {
  expense_id: string;
  participant_id: string;
  percentual: string;
}

interface PersonRow {
  person_id: string;
  nome: string;
  telefone: string;
  criado_em: string;
  atualizado_em: string;
  chave_pix: string;
}

interface AllRows {
  [SHEETS.parties]: PartyRow[];
  [SHEETS.participants]: ParticipantRow[];
  [SHEETS.expenses]: ExpenseRow[];
  [SHEETS.sharedWith]: SharedWithRow[];
  [SHEETS.allocations]: AllocationRow[];
  [SHEETS.percentages]: PercentageRow[];
}

/** Google Sheets (via `valueInputOption: USER_ENTERED`) treats a value
 * starting with `+`, `-`, `=`, or `@` as the start of a formula/expression —
 * the same rule the Sheets UI itself applies when a human types into a
 * cell. A Brazilian phone number like "+55 31 9 9999-9999" trips this and
 * lands as `#ERROR!`. Prefixing with a literal `'` forces the cell to stay
 * plain text, exactly how the Sheets UI escapes it manually; the
 * apostrophe never round-trips back out through `values.get`. */
function asText(value: string): string {
  return /^[+\-=@]/.test(value) ? `'${value}` : value;
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

export class GoogleSheetsRepository implements PartyRepository, PersonRepository {
  constructor(private readonly cfg: GoogleSheetsConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    return googleApiFetch<T>(`${API}/${this.cfg.spreadsheetId}${path}`, {
      ...init,
      apiLabel: "Sheets API",
    });
  }

  // ---- read ---------------------------------------------------------

  /** Reads a single tab's raw cells via `values.get`. Used where only one
   * range is needed (`readPeopleRows`) — grouping a single range into a
   * batch would buy nothing. */
  private async getValues(range: string): Promise<string[][]> {
    const data = await this.request<{ values?: string[][] }>(`/values/${range}`);
    return data.values ?? [];
  }

  /** Reads all six party tabs in a single `values:batchGet` call instead of
   * six separate `values.get` calls — each Sheets API call counts once
   * against the per-user "read requests per minute" quota, so this is a 6x
   * reduction on every party read (list, detail, and the read-before-write
   * inside `saveParty`/`deleteParty`).
   *
   * The response's `valueRanges` are matched back to a tab by ARRAY
   * POSITION, not by the echoed `ValueRange.range` string: the Sheets API
   * always returns `valueRanges` in the same order as the requested
   * `ranges` query params, but it normalizes each entry's own `.range`
   * field to the data's actual extent (e.g. `"parties!A1:F2"` instead of
   * the bare `"parties"` we asked for) — so matching by that echoed string
   * is unreliable, while matching by request order is not. */
  private async readAllRows(): Promise<AllRows> {
    const query = ALL_RANGES.map((range) => `ranges=${encodeURIComponent(range)}`).join("&");
    const data = await this.request<{ valueRanges?: { values?: string[][] }[] }>(
      `/values:batchGet?${query}`,
    );
    const [
      parties = [],
      participants = [],
      expenses = [],
      sharedWith = [],
      allocations = [],
      percentages = [],
    ] = (data.valueRanges ?? []).map((vr) => vr.values ?? []);
    return {
      [SHEETS.parties]: rowsToRecords<PartyRow>(parties),
      [SHEETS.participants]: rowsToRecords<ParticipantRow>(participants),
      [SHEETS.expenses]: rowsToRecords<ExpenseRow>(expenses),
      [SHEETS.sharedWith]: rowsToRecords<SharedWithRow>(sharedWith),
      [SHEETS.allocations]: rowsToRecords<AllocationRow>(allocations),
      [SHEETS.percentages]: rowsToRecords<PercentageRow>(percentages),
    };
  }

  private assembleParties(rows: AllRows): Party[] {
    const participantsByParty = new Map<string, Participant[]>();
    for (const r of rows[SHEETS.participants]) {
      if (!r.participant_id || !r.party_id) continue;
      const list = participantsByParty.get(r.party_id) ?? [];
      list.push({
        id: r.participant_id,
        name: r.nome,
        ...(r.telefone ? { phone: r.telefone } : {}),
        ...(r.chave_pix ? { pixKey: r.chave_pix } : {}),
      });
      participantsByParty.set(r.party_id, list);
    }

    const sharedWithByExpense = new Map<string, string[]>();
    for (const r of rows[SHEETS.sharedWith]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = sharedWithByExpense.get(r.expense_id) ?? [];
      list.push(r.participant_id);
      sharedWithByExpense.set(r.expense_id, list);
    }

    const allocationsByExpense = new Map<string, Allocation[]>();
    for (const r of rows[SHEETS.allocations]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = allocationsByExpense.get(r.expense_id) ?? [];
      list.push({ participantId: r.participant_id, amount: Number(r.valor_centavos) || 0 });
      allocationsByExpense.set(r.expense_id, list);
    }

    const percentagesByExpense = new Map<string, Percentage[]>();
    for (const r of rows[SHEETS.percentages]) {
      if (!r.expense_id || !r.participant_id) continue;
      const list = percentagesByExpense.get(r.expense_id) ?? [];
      list.push({ participantId: r.participant_id, percent: Number(r.percentual) || 0 });
      percentagesByExpense.set(r.expense_id, list);
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
        emoji: r.emoji || DEFAULT_EXPENSE_ICON_KEY,
        totalAmount: Number(r.valor_total_centavos) || 0,
        paidBy: r.paid_by,
        splitType: (r.split_type as SplitType) || "equal",
        sharedWith: sharedWithByExpense.get(r.expense_id) ?? [],
        customMode: (r.custom_mode as CustomMode) || "amount",
        allocations: allocationsByExpense.get(r.expense_id) ?? [],
        percentages: percentagesByExpense.get(r.expense_id) ?? [],
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
        emoji: r.emoji || DEFAULT_PARTY_ICON_KEY,
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
    const allocationsRows: (string | number)[][] = [];
    const percentagesRows: (string | number)[][] = [];

    for (const party of parties) {
      partiesRows.push([
        party.id,
        asText(party.name),
        party.emoji,
        party.date,
        party.createdAt,
        party.updatedAt,
      ]);
      for (const p of party.participants) {
        participantsRows.push([
          p.id,
          party.id,
          asText(p.name),
          asText(p.phone ?? ""),
          asText(p.pixKey ?? ""),
        ]);
      }
      party.expenses.forEach((e, ordem) => {
        expensesRows.push([
          e.id,
          party.id,
          asText(e.description),
          e.emoji,
          e.totalAmount,
          e.paidBy,
          e.splitType,
          e.customMode,
          ordem,
        ]);
        for (const pid of e.sharedWith) sharedWithRows.push([e.id, pid]);
        for (const a of e.allocations) allocationsRows.push([e.id, a.participantId, a.amount]);
        for (const p of e.percentages) percentagesRows.push([e.id, p.participantId, p.percent]);
      });
    }

    const withHeader = (range: string, rows: (string | number)[][]) => [HEADERS[range]!, ...rows];

    return {
      [SHEETS.parties]: withHeader(SHEETS.parties, partiesRows),
      [SHEETS.participants]: withHeader(SHEETS.participants, participantsRows),
      [SHEETS.expenses]: withHeader(SHEETS.expenses, expensesRows),
      [SHEETS.sharedWith]: withHeader(SHEETS.sharedWith, sharedWithRows),
      [SHEETS.allocations]: withHeader(SHEETS.allocations, allocationsRows),
      [SHEETS.percentages]: withHeader(SHEETS.percentages, percentagesRows),
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

  // ---- PersonRepository -------------------------------------------------
  // `people` is party-independent, so it's read/written in isolation from
  // the six party tabs above — never touched by `readAllRows`/`writeAll`.

  private async readPeopleRows(): Promise<Person[]> {
    const values = await this.getValues(PEOPLE_SHEET);
    return rowsToRecords<PersonRow>(values)
      .filter((r) => !!r.person_id)
      .map((r) => ({
        id: r.person_id,
        name: r.nome,
        ...(r.telefone ? { phone: r.telefone } : {}),
        ...(r.chave_pix ? { pixKey: r.chave_pix } : {}),
        createdAt: Number(r.criado_em) || 0,
        updatedAt: Number(r.atualizado_em) || 0,
      }));
  }

  private async writePeople(people: Person[]): Promise<void> {
    const rows: (string | number)[][] = people.map((p) => [
      p.id,
      asText(p.name),
      asText(p.phone ?? ""),
      p.createdAt,
      p.updatedAt,
      asText(p.pixKey ?? ""),
    ]);

    await this.request("/values:batchClear", {
      method: "POST",
      body: JSON.stringify({ ranges: [PEOPLE_SHEET] }),
    });

    await this.request(`/values/${PEOPLE_SHEET}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ range: PEOPLE_SHEET, values: [HEADERS[PEOPLE_SHEET]!, ...rows] }),
    });
  }

  async listPeople(): Promise<Person[]> {
    const people = await this.readPeopleRows();
    return people.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async savePerson(person: Person): Promise<void> {
    const all = await this.readPeopleRows();
    const next = { ...person, updatedAt: Date.now() };
    const index = all.findIndex((p) => p.id === person.id);
    if (index >= 0) all[index] = next;
    else all.push(next);
    await this.writePeople(all);
  }

  async deletePerson(id: string): Promise<void> {
    const all = await this.readPeopleRows();
    await this.writePeople(all.filter((p) => p.id !== id));
  }
}

const HEADERS: Record<string, string[]> = {
  [SHEETS.parties]: ["party_id", "nome", "emoji", "data", "criado_em", "atualizado_em"],
  [SHEETS.participants]: ["participant_id", "party_id", "nome", "telefone", "chave_pix"],
  [SHEETS.expenses]: [
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
  [SHEETS.sharedWith]: ["expense_id", "participant_id"],
  [SHEETS.allocations]: ["expense_id", "participant_id", "valor_centavos"],
  [SHEETS.percentages]: ["expense_id", "participant_id", "percentual"],
  [PEOPLE_SHEET]: ["person_id", "nome", "telefone", "criado_em", "atualizado_em", "chave_pix"],
};
