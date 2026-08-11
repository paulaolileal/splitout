import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, RefreshCw, PartyPopper } from "lucide-react";
import { Caution, Ghost, Success } from "@icon-park/react";
import { AppShell, EmptyState, Money, SectionTitle } from "@/presentation/components/primitives";
import { BalanceCard, SettlementCard } from "@/presentation/components/cards";
import { WhatsAppShareModal } from "@/presentation/components/WhatsAppShareModal";
import { AppIcon } from "@/presentation/icons/registry";
import { useParties } from "@/hooks/queries";
import { consolidateParties } from "@/domain/consolidate";
import { partyTotal, settlementFor } from "@/domain/engine";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { Party } from "@/domain/types";

/** Read-only combined settlement across several rolês, selected on
 * `HomePage` and passed here as `?ids=id1,id2,...` (query string, not
 * navigation state, so the view survives a refresh or gets bookmarked).
 * Never persisted — recomputed from `useParties()`'s cache on every visit
 * via `consolidateParties`. */
export function ConsolidatedReportPage() {
  useDocumentTitle("Acerto consolidado — Splitout!");
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const { data: allParties, isLoading, isError, error, refetch } = useParties();
  const [waGroupOpen, setWaGroupOpen] = useState(false);

  if (isError) {
    return (
      <AppShell>
        <EmptyState
          icon={<Caution theme="multi-color" size={40} />}
          title="Não deu para carregar seus rolês"
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

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </AppShell>
    );
  }

  const byId = new Map((allParties ?? []).map((p) => [p.id, p]));
  // Ids in the URL that no longer exist (rolê deleted meanwhile) are just
  // dropped — not an error, only a smaller consolidated set.
  const selected = ids.map((id) => byId.get(id)).filter((p): p is Party => !!p);

  if (selected.length < 2) {
    return (
      <AppShell>
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Seus rolês
        </Link>
        <EmptyState
          icon={<Ghost theme="multi-color" size={40} />}
          title="Selecione ao menos 2 rolês"
          description="Volte para a lista, marque os rolês que quer consolidar e toque em “Consolidar”."
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

  const consolidated = consolidateParties(selected);
  const total = partyTotal(consolidated);
  const { balances, transfers } = settlementFor(consolidated);
  const balanceOf = (pid: string) => balances.find((b) => b.participantId === pid);

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Seus rolês
      </Link>

      <header className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Acerto consolidado</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {consolidated.sources.map((s) => (
              <Link
                key={s.partyId}
                to={`/role/${s.partyId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-3 pl-1.5 text-sm font-medium text-muted-foreground hover:border-foreground/20"
              >
                <AppIcon iconKey={s.emoji} size={18} />
                {s.partyName}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Total consolidado
          </p>
          <Money cents={total} size="lg" />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="saldos">
          <SectionTitle>
            <span id="saldos">Saldos</span>
          </SectionTitle>
          <ul className="space-y-2">
            {consolidated.participants.map((p) => {
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

        <section aria-labelledby="acerto">
          {transfers.length === 0 ? (
            <EmptyState
              icon={<Success theme="multi-color" size={40} />}
              title="Tudo certo!"
              description="Ninguém deve nada a ninguém nos rolês selecionados."
            />
          ) : (
            <div className="card-surface animate-rise flex flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-2 bg-positive-soft px-5 py-4">
                <div className="flex items-center gap-2">
                  <PartyPopper aria-hidden="true" className="size-5 text-positive" />
                  <h2 id="acerto" className="font-extrabold text-positive">
                    Acerto consolidado
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
              <ul className="space-y-3 p-4">
                {transfers.map((t, index) => (
                  <li key={`${t.from}-${t.to}-${index}`}>
                    <SettlementCard
                      transfer={t}
                      participants={consolidated.participants}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <WhatsAppShareModal
        open={waGroupOpen}
        party={consolidated}
        onClose={() => setWaGroupOpen(false)}
      />
    </AppShell>
  );
}
