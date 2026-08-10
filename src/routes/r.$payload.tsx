import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, EmptyState } from "@/components/acerta/primitives";
import { ShareReport } from "@/components/acerta/ShareReport";
import { decodeSnapshot } from "@/lib/acerta/share";

export const Route = createFileRoute("/r/$payload")({
  head: () => ({
    meta: [
      { title: "Seu acerto — Acerta" },
      {
        name: "description",
        content: "Relatório individual do rolê: quanto você consumiu e para quem precisa pagar.",
      },
      { property: "og:title", content: "Seu acerto — Acerta" },
      {
        property: "og:description",
        content: "Quanto você consumiu e para quem precisa pagar.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedReport,
});

function SharedReport() {
  const { payload } = Route.useParams();
  const snapshot = decodeSnapshot(payload);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        {snapshot ? (
          <>
            <ShareReport snapshot={snapshot} youLabel="Você" />
            <div className="card-surface px-5 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Este é um relatório somente leitura, gerado pelo Acerta.
              </p>
              <Link
                to="/"
                className="mt-3 inline-flex rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                Criar meu rolê no Acerta
              </Link>
            </div>
          </>
        ) : (
          <EmptyState
            emoji="🔗"
            title="Link inválido"
            description="Esse link de acerto parece estar incompleto ou expirado. Peça um novo para quem organizou o rolê."
          />
        )}
      </div>
    </AppShell>
  );
}