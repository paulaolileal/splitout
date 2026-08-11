import { Link, useParams } from "react-router-dom";
import { Unlink } from "@icon-park/react";
import { AppShell, EmptyState } from "@/presentation/components/primitives";
import { ShareReport } from "@/presentation/components/ShareReport";
import { decodeSnapshot } from "@/domain/share";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Public, login-free route: the whole report lives in the URL as a base64url
 * snapshot (see src/domain/share.ts) — no Sheets call, no auth. */
export function SharedReportPage() {
  useDocumentTitle("Seu acerto — Splitout!");
  const { payload = "" } = useParams<{ payload: string }>();
  const snapshot = decodeSnapshot(payload);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        {snapshot ? (
          <>
            <ShareReport snapshot={snapshot} youLabel="Você" />
            <div className="card-surface px-5 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Este é um relatório somente leitura, gerado pelo Splitout.
              </p>
              <Link
                to="/login"
                className="mt-3 inline-flex rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                Criar meu rolê no Splitout
              </Link>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Unlink theme="multi-color" size={40} />}
            title="Link inválido"
            description="Esse link de acerto parece estar incompleto ou expirado. Peça um novo para quem organizou o rolê."
          />
        )}
      </div>
    </AppShell>
  );
}
