import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell, EmptyState } from "@/components/acerta/primitives";
import { ShareActions, ShareReport } from "@/components/acerta/ShareReport";
import { useParty } from "@/lib/acerta/store";
import { buildSnapshot } from "@/lib/acerta/report";
import { encodeSnapshot } from "@/lib/acerta/share";
import { formatBRL } from "@/lib/acerta/format";

export const Route = createFileRoute("/role/$id/p/$pid")({
  head: () => ({
    meta: [
      { title: "Acerto individual — Acerta" },
      {
        name: "description",
        content: "Veja quanto essa pessoa consumiu, quanto pagou e para quem precisa acertar.",
      },
      { property: "og:title", content: "Acerto individual — Acerta" },
      {
        property: "og:description",
        content: "Quanto consumiu, quanto pagou e para quem precisa acertar.",
      },
    ],
  }),
  component: ParticipantReport,
});

function ParticipantReport() {
  const { id, pid } = Route.useParams();
  const { party } = useParty(id);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  if (party === undefined) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </AppShell>
    );
  }

  const snapshot = party ? buildSnapshot(party, pid) : null;

  if (!party || !snapshot) {
    return (
      <AppShell>
        <EmptyState
          emoji="🕵️"
          title="Acerto não encontrado"
          description="Não encontramos esse participante neste dispositivo."
          action={
            <Link to="/" className="mt-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground">
              Voltar para o início
            </Link>
          }
        />
      </AppShell>
    );
  }

  const toPay = snapshot.pay.reduce((a, l) => a + l.a, 0);
  const url = `${origin}/r/${encodeSnapshot(snapshot)}`;
  const text = `💸 O acerto de ${snapshot.n} no rolê "${snapshot.p}" ficou em ${formatBRL(
    toPay || snapshot.get.reduce((a, l) => a + l.a, 0),
  )}. Veja os detalhes no Acerta.`;

  return (
    <AppShell>
      <Link
        to="/role/$id"
        params={{ id }}
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para o rolê
      </Link>
      <div className="mx-auto max-w-xl space-y-6">
        <ShareReport snapshot={snapshot} youLabel={snapshot.n} />
        <ShareActions url={url} text={text} />
        <p className="text-center text-xs text-muted-foreground">
          O link mostra apenas o acerto de {snapshot.n} — sem login e sem acesso ao rolê completo.
        </p>
      </div>
    </AppShell>
  );
}