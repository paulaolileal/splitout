/**
 * Slim credit bar shown at the bottom of every screen in the app.
 * Kept deliberately subtle — the prominent LealTEK credit lives on
 * `LoginPage` instead (see `LoginCredit`).
 */
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border/60 py-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4">
        <a
          href="https://lealtek.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Conheça a LealTEK"
          className="inline-flex items-center gap-2 text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <span className="text-[11px] font-medium tracking-wide">um produto</span>
          <img src="/lealtek-full.png" alt="LealTEK" className="h-4 object-contain" />
        </a>
      </div>
    </footer>
  );
}
