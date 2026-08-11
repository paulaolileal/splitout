import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { registerSW } from "virtual:pwa-register";
import { App } from "./presentation/App";
import { ErrorBoundary } from "./presentation/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAuthError, GoogleQuotaError } from "@/infrastructure/google/googleApiFetch";
import { showReconnectToast } from "@/lib/googleAuthToast";
import { showQuotaExceededToast } from "@/lib/googleQuotaToast";
import { initAuthScheduler } from "@/services/googleAuth";
import "./styles.css";

registerSW({ immediate: true });
initAuthScheduler();

const TEN_MINUTES = 10 * 60 * 1000;

/** Surfaces Google API errors consistently across every query and mutation,
 *  regardless of whether the call site wires its own `onError` — dispatches
 *  to the matching toast (`showReconnectToast`/`showQuotaExceededToast`). */
function handleGoogleApiError(error: unknown) {
  if (error instanceof GoogleAuthError) showReconnectToast();
  else if (error instanceof GoogleQuotaError) showQuotaExceededToast();
}

/** Neither a session-expiry nor a rate-quota error improves on an immediate
 *  retry, so both skip React Query's default retry — retrying them just
 *  doubles the read volume right when the quota is already exceeded. Any
 *  other (presumably transient) error still gets one retry. */
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof GoogleAuthError || error instanceof GoogleQuotaError) return false;
  return failureCount < 1;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: TEN_MINUTES,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
  },
  queryCache: new QueryCache({ onError: handleGoogleApiError }),
  mutationCache: new MutationCache({ onError: handleGoogleApiError }),
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "splitout:query-cache",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: TEN_MINUTES, buster: "v1" }}
      >
        <BrowserRouter>
          <App />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
