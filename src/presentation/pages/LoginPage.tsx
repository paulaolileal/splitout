import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { signIn, silentSignIn, getAccessToken } from "@/services/googleAuth";
import { useAuthStore } from "@/store/authStore";
import { useSpreadsheetStore } from "@/store/spreadsheetStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage() {
  useDocumentTitle("Splitout! — Divida o rolê. Acerte as contas.");
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function redirectAfterLogin(email: string) {
    const hasSpreadsheet = !!useSpreadsheetStore.getState().byEmail[email];
    navigate(hasSpreadsheet ? "/" : "/setup", { replace: true });
  }

  useEffect(() => {
    if (!user || getAccessToken()) return;
    setLoading(true);
    silentSignIn().then((info) => {
      if (info) {
        setUser(info);
        redirectAfterLogin(info.email);
      } else {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user && getAccessToken()) {
    const hasSpreadsheet = !!useSpreadsheetStore.getState().byEmail[user.email];
    return <Navigate to={hasSpreadsheet ? "/" : "/setup"} replace />;
  }

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const info = await signIn();
      setUser(info);
      redirectAfterLogin(info.email);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="animate-rise card-surface overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              <Sparkles aria-hidden="true" className="size-3.5" /> sem planilha, sem discussão
            </span>
            <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold">
              Divida o rolê.
              <br />
              <span className="text-primary">Acerte as contas.</span>
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Cada pessoa consumiu uma coisa, outra pagou a conta inteira. O Splitout calcula quem
              paga quanto para quem — tudo salvo direto na sua conta Google.
            </p>

            <div className="mt-8 space-y-3">
              {error ? (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {loading ? (user ? "Reconectando…" : "Entrando…") : "Entrar com Google"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Seus rolês ficam salvos numa planilha na pasta "LealTEK Apps" do seu Google Drive.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Só quer ver como funciona?{" "}
            <Link to="/exemplo" className="font-semibold text-foreground underline">
              Veja um exemplo
            </Link>
          </p>
        </div>
      </div>

      <LoginCredit />
    </div>
  );
}

/**
 * Prominent, on-brand credit for the app's entry screen — the "destaque"
 * a first-time visitor sees, as opposed to the subtle `Footer` shown on
 * every other screen once the user is inside the app.
 */
function LoginCredit() {
  return (
    <footer className="shrink-0 border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-4 text-center">
        <a
          href="https://lealtek.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Conheça a LealTEK"
          className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Um produto
          </span>
          <img src="/lealtek-full.png" alt="LealTEK" className="h-8 object-contain" />
        </a>
      </div>
    </footer>
  );
}
