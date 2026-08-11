import { Link } from "react-router-dom";
import { Logo } from "@/presentation/components/Logo";
import { useAuthStore } from "@/store/authStore";

/**
 * Full-width footer section shown at the bottom of every screen — the
 * login/entry screen included, so this is the one place that needs to
 * carry both the app's own identity and a properly prominent LealTEK
 * credit (as opposed to a barely-visible watermark).
 */
export function Footer() {
  const user = useAuthStore((s) => s.user);
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 bg-foreground text-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo className="text-2xl" />
            <p className="mt-3 text-sm text-background/70">
              Divida o rolê, acerte as contas — sem planilha manual, sem discussão.
            </p>
          </div>

          <nav aria-label="Navegação do rodapé" className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <Link
              to="/"
              className="font-semibold text-background/80 transition-colors hover:text-background"
            >
              Início
            </Link>
            {user ? (
              <Link
                to="/pessoas"
                className="font-semibold text-background/80 transition-colors hover:text-background"
              >
                Pessoas
              </Link>
            ) : null}
            <Link
              to="/exemplo"
              className="font-semibold text-background/80 transition-colors hover:text-background"
            >
              Ver exemplo
            </Link>
          </nav>
        </div>

        <div className="mt-10 h-px w-full bg-background/15" />

        <div className="mt-6 flex flex-col-reverse items-center gap-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-background/60">
            © {year} Splitout! Todos os direitos reservados.
          </p>
          <a
            href="https://lealtek.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Conheça a LealTEK"
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <span className="text-[11px] font-semibold tracking-[0.2em] text-background/60 uppercase">
              Um produto
            </span>
            <img src="/lealtek-full.png" alt="LealTEK" className="h-7 object-contain" />
          </a>
        </div>
      </div>
    </footer>
  );
}
