import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AppShell, EmptyState } from "@/presentation/components/primitives";
import { ShareActions, ShareReport } from "@/presentation/components/ShareReport";
import { useParty } from "@/hooks/queries";
import { buildSnapshot } from "@/domain/report";
import { encodeSnapshot } from "@/domain/share";
import { formatBRL } from "@/domain/format";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function ParticipantReportPage() {
  const { id = "", pid = "" } = useParams<{ id: string; pid: string }>();
  const { party, isLoading, isError, error, refetch } = useParty(id);
  const [origin, setOrigin] = useState("");

  useDocumentTitle("Acertando as contas — Splitout!");
  useEffect(() => setOrigin(window.location.origin), []);

  if (isError) {
    return (
      <AppShell>
        <EmptyState
          emoji="⚠️"
          title="Não deu para carregar esse acerto"
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

  const snapshot = party ? buildSnapshot(party, pid) : null;

  if (!party || !snapshot) {
    return (
      <AppShell>
        <EmptyState
          emoji="🕵️"
          title="Acerto não encontrado"
          description="Não encontramos esse participante neste rolê."
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

  const toPay = snapshot.pay.reduce((a, l) => a + l.a, 0);
  const url = `${origin}/r/${encodeSnapshot(snapshot)}`;
  const text = `💸 O acerto de ${snapshot.n} no rolê "${snapshot.p}" ficou em ${formatBRL(
    toPay || snapshot.get.reduce((a, l) => a + l.a, 0),
  )}. Veja os detalhes no Splitout.`;

  return (
    <AppShell>
      <Link
        to={`/role/${id}`}
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
