import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AppShell, Money, SectionTitle } from "@/presentation/components/primitives";
import { ParticipantAvatar } from "@/presentation/components/ParticipantAvatar";
import { ExpenseCard, BalanceCard } from "@/presentation/components/cards";
import { sampleParty } from "@/domain/sample";
import { partyTotal, settlementFor } from "@/domain/engine";
import { formatDate } from "@/domain/format";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Public, read-only demo of a fictional party — never persisted, never
 * touches Google Sheets. Lets a visitor see how Splitout works before
 * signing in with Google (which is required to create a real party). */
export function SamplePage() {
  useDocumentTitle("Exemplo — Splitout!");
  const party = sampleParty();
  const total = partyTotal(party);
  const { balances, transfers } = settlementFor(party);
  const balanceOf = (pid: string) => balances.find((b) => b.participantId === pid);

  return (
    <AppShell
      action={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <Sparkles aria-hidden="true" className="size-3.5" /> Criar meu rolê
        </Link>
      }
    >
      <Link
        to="/login"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Voltar
      </Link>

      <div className="animate-rise mb-6 rounded-3xl border border-dashed border-border bg-accent/40 px-5 py-4 text-sm text-accent-foreground">
        Isso é um exemplo — os dados não são salvos.{" "}
        <Link to="/login" className="font-bold underline">
          Crie o seu com login Google
        </Link>
        .
      </div>

      <header className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-4xl">
            {party.emoji}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{party.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(party.date)} · {party.participants.length} pessoas ·{" "}
              {party.expenses.length} despesa
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

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <section>
          <SectionTitle>Saldos</SectionTitle>
          <ul className="space-y-2">
            {party.participants.map((p) => {
              const b = balanceOf(p.id);
              return (
                <li key={p.id}>
                  <BalanceCard
                    participant={p}
                    paid={b?.paid ?? 0}
                    owed={b?.owed ?? 0}
                    balance={b?.balance ?? 0}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-8">
          <section>
            <SectionTitle>Despesas</SectionTitle>
            <ul className="space-y-3">
              {party.expenses.map((expense) => (
                <li key={expense.id}>
                  <ExpenseCard expense={expense} participants={party.participants} />
                </li>
              ))}
            </ul>
          </section>

          {transfers.length > 0 ? (
            <section>
              <div className="card-surface animate-rise overflow-hidden">
                <div className="flex items-center gap-2 bg-positive-soft px-5 py-4">
                  <h2 className="font-extrabold text-positive">Acerto</h2>
                </div>
                <ul className="space-y-3 p-4">
                  {transfers.map((t, index) => {
                    const from = party.participants.find((p) => p.id === t.from);
                    const to = party.participants.find((p) => p.id === t.to);
                    return (
                      <li
                        key={`${t.from}-${t.to}-${index}`}
                        className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2"
                      >
                        <ParticipantAvatar id={from?.id} name={from?.name ?? "?"} size="sm" />
                        <span className="text-sm font-semibold">{from?.name}</span>
                        <Money cents={t.amount} size="sm" className="ml-auto" />
                        <span className="text-sm font-semibold">{to?.name}</span>
                        <ParticipantAvatar id={to?.id} name={to?.name ?? "?"} size="sm" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
