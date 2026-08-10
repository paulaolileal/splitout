import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** App-level error boundary. React Router v7's declarative `<Routes>` has no
 * built-in `errorElement` (that's a `createBrowserRouter`-only feature) — a
 * plain class boundary wrapping `<App />` covers render-time crashes the same
 * way the old TanStack Router `errorComponent` did. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: { componentStack: string | null }) {
    console.error(error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    window.location.assign("/");
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Essa página não carregou
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Algo deu errado. Você pode tentar de novo ou voltar para o início.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    );
  }
}
