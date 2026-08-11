import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ensureSchema } from "@/application/ensureSchema";
import { useAuthStore } from "@/store/authStore";
import { useSpreadsheetStore } from "@/store/spreadsheetStore";

/** Guards every page that reads/writes Sheets data. Beyond the auth/linked-
 * spreadsheet checks, it also self-heals the spreadsheet's schema
 * (`ensureSchema`) before rendering anything — this is what lets users who
 * linked their spreadsheet before a schema change (e.g. the `people` tab)
 * pick up new tabs/headers automatically, without going through `/setup`
 * again. */
export function SpreadsheetRoute() {
  const user = useAuthStore((s) => s.user);
  const byEmail = useSpreadsheetStore((s) => s.byEmail);
  const spreadsheetId = user ? byEmail[user.email] : undefined;

  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spreadsheetId) return;
    let active = true;
    setStatus("checking");
    ensureSchema(spreadsheetId)
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((e: Error) => {
        if (active) {
          setError(e.message);
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [spreadsheetId]);

  if (!user) return <Navigate to="/login" replace />;
  if (!spreadsheetId) return <Navigate to="/setup" replace />;

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <p className="max-w-sm rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {error ?? "Não deu para preparar sua planilha."}
        </p>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return <Outlet />;
}
