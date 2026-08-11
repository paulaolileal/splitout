import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  PartyPopper,
} from "lucide-react";
import { Caution, Ghost, Peoples, Bill } from "@icon-park/react";
import { AppShell, EmptyState, Money, SectionTitle } from "@/presentation/components/primitives";
import { ParticipantChip } from "@/presentation/components/ParticipantAvatar";
import { BalanceCard, ExpenseCard, SettlementCard } from "@/presentation/components/cards";
import { ExpenseEditor } from "@/presentation/components/ExpenseEditor";
import { PartyEditor } from "@/presentation/components/PartyEditor";
import { PeoplePicker } from "@/presentation/components/PeoplePicker";
import { WhatsAppShareModal } from "@/presentation/components/WhatsAppShareModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppIcon } from "@/presentation/icons/registry";
import { useDeleteParty, useParty } from "@/hooks/queries";
import { newExpense } from "@/domain/factories";
import { partyTotal, settlementFor } from "@/domain/engine";
import { formatDate } from "@/domain/format";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { Expense, Participant } from "@/domain/types";

export function PartyPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { party, isLoading, isError, error, refetch, update } = useParty(id);
  const deleteParty = useDeleteParty();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editingParty, setEditingParty] = useState(false);
  const [waGroupOpen, setWaGroupOpen] = useState(false);

  useDocumentTitle(party ? `${party.name} — Splitout!` : "Seu rolê — Splitout!");

  if (isError) {
    return (
      <AppShell>
        <EmptyState
          icon={<Caution theme="multi-color" size={40} />}
          title="Não deu para carregar esse rolê"
          description={(error as Error)?.message ?? "Verifique sua conexão e tente novamente."}
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
            >
              <RefreshCw aria-hidden="true" className="size-4" /> Tentar de novo
            </button>
          }
        />
      </AppShell>
    );
  }

  if (isLoading || party === undefined) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </AppShell>
    );
  }

  if (party === null) {
    return (
      <AppShell>
        <EmptyState
          icon={<Ghost theme="multi-color" size={40} />}
          title="Rolê não encontrado"
          description="Ele pode ter sido excluído ou o link está incorreto."
          action={
            <Link
              to="/"
              className="mt-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
            >
              Voltar para o início
            </Link>
          }
        />
      </AppShell>
    );
  }

  const total = partyTotal(party);
  const { balances, transfers } = settlementFor(party);
  const balanceOf = (pid: string) => balances.find((b) => b.participantId === pid);

  const addParticipant = (participant: Participant) => {
    if (party.participants.some((p) => p.name.toLowerCase() === participant.name.toLowerCase()))
      return;
    update((draft) => ({ ...draft, participants: [...draft.participants, participant] }));
  };

  const removeParticipant = (pid: string) =>
    update((draft) => ({
      ...draft,
      participants: draft.participants.filter((p) => p.id !== pid),
      expenses: draft.expenses.filter((e) => e.paidBy !== pid),
    }));

  const savePartyMeta = (values: { name: string; emoji: string; date: string }) => {
    update((draft) => ({ ...draft, ...values }));
    setEditingParty(false);
  };

  const saveExpense = (expense: Expense) => {
    update((draft) => {
      const index = draft.expenses.findIndex((e) => e.id === expense.id);
      if (index >= 0) draft.expenses[index] = expense;
      else draft.expenses.push(expense);
      return draft;
    });
    setEditing(null);
  };

  // Rendered either inside the "Despesas"/"Rolê acertado" tabs (when there's
  // a settlement to show) or standalone (when there isn't yet) — see the
  // `transfers.length > 0` branch below. Its parent is always a
  // `flex flex-col max-h-[…]` column (same cap as the "Saldos" column on the
  // left), so the header (`shrink-0`) stays put and the list
  // (`flex-1 min-h-0 overflow-y-auto`) grows to fill whatever room is left —
  // a fixed height on the list alone can't do this because "Saldos" starts
  // lower on the page (below the participants card) and needs correspondingly
  // less room to still end at the same height as "Despesas".
  const expensesSection = (
    <>
      <div className="shrink-0">
        <SectionTitle
          aside={
            party.participants.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setEditing(
                    newExpense(
                      party.participants[0]!.id,
                      party.participants.map((p) => p.id),
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Plus aria-hidden="true" className="size-3.5" /> Adicionar despesa
              </button>
            ) : null
          }
        >
          <span id="despesas">Despesas</span>
        </SectionTitle>
      </div>

      {party.participants.length === 0 ? (
        <EmptyState
          icon={<Peoples theme="multi-color" size={40} />}
          title="Adicione as pessoas primeiro"
          description="Depois de listar quem está no rolê, você pode lançar as despesas."
        />
      ) : party.expenses.length === 0 ? (
        <EmptyState
          icon={<Bill theme="multi-color" size={40} />}
          title="Nenhuma despesa ainda"
          description="Lance a primeira conta e diga quem pagou e quem consumiu o quê."
          action={
            <button
              type="button"
              onClick={() =>
                setEditing(
                  newExpense(
                    party.participants[0]!.id,
                    party.participants.map((p) => p.id),
                  ),
                )
              }
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
            >
              <Plus aria-hidden="true" className="size-4" /> Adicionar despesa
            </button>
          }
        />
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {party.expenses.map((expense) => (
            <li key={expense.id}>
              <ExpenseCard
                expense={expense}
                participants={party.participants}
                onClick={() => setEditing(expense)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const settlementSection = (
    <div className="card-surface animate-rise flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 bg-positive-soft px-5 py-4">
        <div className="flex items-center gap-2">
          <PartyPopper aria-hidden="true" className="size-5 text-positive" />
          <h2 id="acerto" className="font-extrabold text-positive">
            Rolê acertado!
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setWaGroupOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-positive/30 bg-card px-3 py-1.5 text-xs font-bold text-positive"
        >
          <MessageCircle aria-hidden="true" className="size-3.5" /> Enviar no WhatsApp
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {transfers.map((t, index) => (
          <li key={`${t.from}-${t.to}-${index}`}>
            <SettlementCard
              transfer={t}
              participants={party.participants}
              index={index}
              onClick={() => void navigate(`/role/${party.id}/p/${t.from}`)}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AppShell
      action={
        <button
          type="button"
          onClick={() => {
            deleteParty.mutate(party.id);
            void navigate("/");
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      }
    >
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Seus rolês
      </Link>

      <header className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true">
            <AppIcon iconKey={party.emoji} size={44} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold sm:text-4xl">{party.name}</h1>
              <button
                type="button"
                aria-label="Editar rolê"
                onClick={() => setEditingParty(true)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil aria-hidden="true" className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(party.date)} · {party.participants.length} pessoa
              {party.participants.length === 1 ? "" : "s"} · {party.expenses.length} despesa
              {party.expenses.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Total do rolê
          </p>
          <Money cents={total} size="lg" />
        </div>
      </header>

      {/* Both columns share the same `max-h-[30rem]` cap, measured from the
          top of this row. "Saldos" starts lower than "Despesas" (it sits
          below the participants card), so giving both columns — not just
          their inner lists — the same cap and letting the list flex to fill
          what's left naturally gives "Saldos" a shorter list, which is what
          makes the two columns actually end at the same height. */}
      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-stretch">
        <section aria-labelledby="participantes" className="flex max-h-[30rem] flex-col">
          <div className="shrink-0">
            <SectionTitle>
              <span id="participantes">Quem está no rolê?</span>
            </SectionTitle>
            <div className="card-surface space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                {party.participants.map((p) => (
                  <ParticipantChip
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    onRemove={() => removeParticipant(p.id)}
                  />
                ))}
                {party.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Comece adicionando as pessoas do rolê.
                  </p>
                ) : null}
              </div>
              <PeoplePicker
                existingNames={party.participants.map((p) => p.name)}
                onPick={addParticipant}
              />
            </div>
          </div>

          {party.expenses.length > 0 ? (
            <div className="mt-6 flex min-h-0 flex-1 flex-col">
              <div className="shrink-0">
                <SectionTitle>Saldos</SectionTitle>
              </div>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {party.participants.map((p) => {
                  const b = balanceOf(p.id);
                  return (
                    <li key={p.id}>
                      <BalanceCard
                        participant={p}
                        paid={b?.paid ?? 0}
                        owed={b?.owed ?? 0}
                        balance={b?.balance ?? 0}
                        onClick={() => void navigate(`/role/${party.id}/p/${p.id}`)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>

        {transfers.length > 0 ? (
          <Tabs defaultValue="despesas" className="flex max-h-[30rem] flex-col">
            <TabsList className="mb-4 grid w-full shrink-0 grid-cols-2">
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="acerto">Rolê acertado</TabsTrigger>
            </TabsList>
            <TabsContent value="despesas" className="mt-0 flex min-h-0 flex-1 flex-col">
              {expensesSection}
            </TabsContent>
            <TabsContent value="acerto" className="mt-0 flex min-h-0 flex-1 flex-col">
              {settlementSection}
            </TabsContent>
          </Tabs>
        ) : (
          <section aria-labelledby="despesas" className="flex max-h-[30rem] flex-col">
            {expensesSection}
          </section>
        )}
      </div>

      <ExpenseEditor
        open={editing !== null}
        expense={editing}
        participants={party.participants}
        onClose={() => setEditing(null)}
        onSave={saveExpense}
        onDelete={(expenseId) => {
          update((draft) => ({
            ...draft,
            expenses: draft.expenses.filter((e) => e.id !== expenseId),
          }));
          setEditing(null);
        }}
      />

      <WhatsAppShareModal open={waGroupOpen} party={party} onClose={() => setWaGroupOpen(false)} />

      <PartyEditor
        open={editingParty}
        party={party}
        onClose={() => setEditingParty(false)}
        onSave={savePartyMeta}
      />
    </AppShell>
  );
}
