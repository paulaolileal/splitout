import { toast } from "sonner";

const QUOTA_TOAST_ID = "google-quota";

/**
 * Shows a transient toast when a `GoogleQuotaError` bubbles up (the Sheets/
 * Drive API's per-user rate quota was exceeded). Unlike `showReconnectToast`
 * (session expiry, needs a user action to resolve), a quota error resolves
 * itself once the per-minute window rolls over — so this just asks the user
 * to wait, with no "reconnect"-style action button.
 */
export function showQuotaExceededToast(): void {
  toast.error("Muita coisa ao mesmo tempo no Google Sheets", {
    id: QUOTA_TOAST_ID,
    duration: 8000,
    description: "Aguarde cerca de 1 minuto e tente de novo.",
  });
}
