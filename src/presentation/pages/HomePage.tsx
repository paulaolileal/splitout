import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { Caution, PartyBalloon, Success } from "@icon-park/react";
import {
  AppShell,
  EmptyState,
  Money,
  SectionTitle,
  fabPositionClassName,
  useFooterProximity,
} from "@/presentation/components/primitives";
import { ParticipantAvatar } from "@/presentation/components/ParticipantAvatar";
import { resolveIcon } from "@/presentation/icons/registry";
import { useParties } from "@/hooks/queries";
import { partyTotal, settlementFor } from "@/domain/engine";
import { formatDate } from "@/domain/format";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function HomePage() {
  useDocumentTitle("Seus rolês — Splitout!");
  const { data: parties, isLoading, isError, error, refetch } = useParties();
  const dockFabAboveFooter = useFooterProximity();

  return (
    <AppShell
      action={
        <Link
          to="/role/novo"
          className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-pop sm:inline-flex"
        >
          <Plus aria-hidden="true" className="size-4" /> Novo rolê
        </Link>
      }
    >
      <SectionTitle>Seus rolês</SectionTitle>

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
            const PartyIcon = resolveIcon(party.emoji);
            return (
              <li key={party.id}>
                <Link
                  to={`/role/${party.id}`}
                  className="card-surface animate-rise block px-5 py-4 transition-transform hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true">
                        <PartyIcon theme="multi-color" size={28} />
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
                        color:
                          transfers.length === 0 ? "var(--positive)" : "var(--muted-foreground)",
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/role/novo"
        aria-label="Novo rolê"
        className={`${fabPositionClassName(dockFabAboveFooter, "sm")} inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4 font-bold text-primary-foreground shadow-pop`}
      >
        <Plus aria-hidden="true" className="size-5" /> Novo rolê
      </Link>
    </AppShell>
  );
}
