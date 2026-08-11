import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DriveApiClient } from "@/infrastructure/google/DriveApiClient";
import { SheetsInitializer } from "@/infrastructure/google/SheetsInitializer";
import { useAuthStore } from "@/store/authStore";
import { useSpreadsheetStore } from "@/store/spreadsheetStore";
import { clearSheetProvider } from "@/application/repositoryProvider";
import { ensureSchema } from "@/application/ensureSchema";
import { Logo } from "@/presentation/components/primitives";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const FOLDER_NAME = "LealTEK Apps";
const SPREADSHEET_TITLE = "Splitout";

const STEPS = ["Verificando sua planilha…", "Configurando as abas…", "Quase lá…"] as const;

export function SetupPage() {
  useDocumentTitle("Preparando sua planilha — Splitout!");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user)!;
  const setSpreadsheetId = useSpreadsheetStore((s) => s.setSpreadsheetId);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (error) return;
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [error]);

  useEffect(() => {
    if (connectingRef.current) return;
    connectingRef.current = true;

    async function connect() {
      const drive = new DriveApiClient();
      const initializer = new SheetsInitializer();

      // Resolve the folder first and search *inside* it — a global by-name
      // search across all of Drive can match an unrelated same-named
      // spreadsheet (a stray manual copy, a leftover from an older app
      // version) and silently link the wrong file.
      const folderId = await drive.getOrCreateFolder(FOLDER_NAME);
      const found = await drive.listSpreadsheets(SPREADSHEET_TITLE, folderId);

      let spreadsheetId: string;
      if (found.length > 0) {
        spreadsheetId = found[0]!.id;
        await ensureSchema(spreadsheetId);
      } else {
        spreadsheetId = await initializer.createSpreadsheet(SPREADSHEET_TITLE);
        await drive.moveToFolder(spreadsheetId, folderId);
      }

      setSpreadsheetId(user.email, spreadsheetId);
      clearSheetProvider();
      qc.clear();
      navigate("/", { replace: true });
    }

    connect().catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        <Logo />
        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 aria-hidden="true" className="size-6 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">{STEPS[step]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conectando ao Google Drive · pasta "{FOLDER_NAME}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
