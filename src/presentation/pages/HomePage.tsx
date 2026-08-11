import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckSquare, Plus, RefreshCw, X } from "lucide-react";
import { Caution, PartyBalloon, Success } from "@icon-park/react";
import { AppShell, EmptyState, Money, SectionTitle } from "@/presentation/components/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { ParticipantAvatar } from "@/presentation/components/ParticipantAvatar";
import { AppIcon } from "@/presentation/icons/registry";
import { useParties } from "@/hooks/queries";
import { partyTotal, settlementFor } from "@/domain/engine";
import { formatDate } from "@/domain/format";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function HomePage() {
  useDocumentTitle("Seus rolês — Splitout!");
  const navigate = useNavigate();
  const { data: parties, isLoading, isError, error, refetch } = useParties();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stopSelecting = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const consolidate = () => {
    // Keep the ids in the same order the parties are listed, for a
    // deterministic query string regardless of click order.
    const ids = (parties ?? []).map((p) => p.id).filter((id) => selected.has(id));
    void navigate(`/consolidado?ids=${ids.join(",")}`);
  };

  return (
    <AppShell
      action={
        selectionMode ? (
          <button
            type="button"
            onClick={stopSelecting}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" className="size-3.5" /> Cancelar
          </button>
        ) : null
      }
    >
      <SectionTitle
        aside={
          !selectionMode ? (
            <div className="flex items-center gap-2">
              {parties && parties.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectionMode(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background shadow-pop"
                >
                  <CheckSquare aria-hidden="true" className="size-4" /> Consolidar
                </button>
              ) : null}
              <Link
                to="/role/novo"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-pop"
              >
                <Plus aria-hidden="true" className="size-4" /> Novo rolê
              </Link>
            </div>
          ) : null
        }
      >
        Seus rolês
      </SectionTitle>

      {isError ? (
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
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : !parties || parties.length === 0 ? (
        <EmptyState
          icon={<PartyBalloon theme="multi-color" size={40} />}
          title="Nenhum rolê por aqui ainda"
          description="Crie o primeiro rolê e comece a somar as despesas com a galera."
          action={
            <Link
              to="/role/novo"
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
            >
              <Plus aria-hidden="true" className="size-4" /> Criar meu primeiro rolê
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {parties.map((party, index) => {
            const total = partyTotal(party);
            const { transfers } = settlementFor(party);
            const isSelected = selected.has(party.id);
            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true">
                      <AppIcon iconKey={party.emoji} size={28} />
                    </span>
                    <div>
                      <p className="font-bold">{party.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(party.date)}</p>
                    </div>
                  </div>
                  <Money cents={total} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {party.participants.slice(0, 5).map((p) => (
                      <ParticipantAvatar key={p.id} id={p.id} name={p.name} size="sm" />
                    ))}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor:
                        transfers.length === 0 ? "var(--positive-soft)" : "var(--muted)",
                      color: transfers.length === 0 ? "var(--positive)" : "var(--muted-foreground)",
                    }}
                  >
                    {party.expenses.length === 0 ? (
                      "Sem despesas"
                    ) : transfers.length === 0 ? (
                      <>
                        <Success theme="multi-color" size={14} /> Acertado
                      </>
                    ) : (
                      `${transfers.length} acerto${transfers.length > 1 ? "s" : ""} pendente${transfers.length > 1 ? "s" : ""}`
                    )}
                  </span>
                </div>
              </>
            );

            return (
              <li key={party.id} className="relative">
                {selectionMode ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => toggle(party.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(party.id);
                      }
                    }}
                    className="card-surface animate-rise block cursor-pointer px-5 py-4 pl-11 transition-transform hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {cardContent}
                  </div>
                ) : (
                  <Link
                    to={`/role/${party.id}`}
                    className="card-surface animate-rise block px-5 py-4 transition-transform hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {cardContent}
                  </Link>
                )}
                {selectionMode ? (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(party.id)}
                    aria-label={`Selecionar ${party.name}`}
                    className="absolute top-4 left-4"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {selectionMode ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
          <div className="card-surface flex w-full max-w-md items-center justify-between gap-3 px-5 py-3 shadow-pop">
            <span className="text-sm font-semibold text-muted-foreground">
              {selected.size === 0
                ? "Nenhum rolê selecionado"
                : `${selected.size} rolê${selected.size > 1 ? "s" : ""} selecionado${selected.size > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              onClick={consolidate}
              disabled={selected.size < 2}
              title={selected.size === 1 ? "Selecione mais um rolê" : undefined}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-pop disabled:opacity-40 disabled:shadow-none"
            >
              Consolidar
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
