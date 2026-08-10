import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Sparkles } from "lucide-react";
import { AppShell, EmptyState, Money, SectionTitle } from "@/components/acerta/primitives";
import { ParticipantAvatar } from "@/components/acerta/ParticipantAvatar";
import { useParties } from "@/lib/acerta/store";
import { partyTotal, settlementFor } from "@/lib/acerta/engine";
import { formatDate } from "@/lib/acerta/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acerta — Divida o rolê. Acerte as contas." },
      {
        name: "description",
        content:
          "Crie um rolê, adicione as pessoas e as despesas: o Acerta calcula quem deve quanto para quem e gera o acerto de cada um.",
      },
      { property: "og:title", content: "Acerta — Divida o rolê. Acerte as contas." },
      {
        property: "og:description",
        content: "Divida despesas de viagens, bares e rolês sem confusão. Simples e rápido.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const parties = useParties();

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
      <section className="animate-rise mb-10 overflow-hidden rounded-4xl border border-border bg-card px-6 py-10 shadow-card sm:px-10 sm:py-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          <Sparkles aria-hidden="true" className="size-3.5" /> sem planilha, sem discussão
        </span>
        <h1 className="mt-4 max-w-xl text-4xl leading-[1.05] font-extrabold sm:text-6xl">
          Divida o rolê.
          <br />
          <span className="text-primary">Acerte as contas.</span>
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Cada pessoa consumiu uma coisa, outra pagou a conta inteira. O Acerta calcula quem paga
          quanto para quem — e manda o acerto de cada um por link.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/role/novo"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="size-5" /> Novo rolê
          </Link>
          <Link
            to="/role/$id"
            params={{ id: "exemplo" }}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-6 py-4 text-base font-semibold"
          >
            Ver um exemplo
          </Link>
        </div>
      </section>

      <SectionTitle>Seus rolês</SectionTitle>

      {parties === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : parties.length === 0 ? (
        <EmptyState
          emoji="🎈"
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
            return (
              <li key={party.id}>
                <Link
                  to="/role/$id"
                  params={{ id: party.id }}
                  className="card-surface animate-rise block px-5 py-4 transition-transform hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="text-2xl">
                        {party.emoji}
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
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          transfers.length === 0 ? "var(--positive-soft)" : "var(--muted)",
                        color:
                          transfers.length === 0 ? "var(--positive)" : "var(--muted-foreground)",
                      }}
                    >
                      {party.expenses.length === 0
                        ? "Sem despesas"
                        : transfers.length === 0
                          ? "✓ Acertado"
                          : `${transfers.length} acerto${transfers.length > 1 ? "s" : ""} pendente${transfers.length > 1 ? "s" : ""}`}
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
        className="fixed right-5 bottom-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4 font-bold text-primary-foreground shadow-pop sm:hidden"
      >
        <Plus aria-hidden="true" className="size-5" /> Novo rolê
      </Link>
    </AppShell>
  );
}
