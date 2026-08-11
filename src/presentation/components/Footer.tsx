/**
 * Footer shown at the bottom of every screen, login included. Deliberately
 * doesn't repeat the "Splitout!" wordmark — that's already in the header on
 * every page — so the only thing competing for attention here is the
 * LealTEK credit itself, sized to actually read as one.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-border/70 bg-muted/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
        <a
          href="https://lealtek.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Conheça a LealTEK"
          className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Um produto
          </span>
          <img src="/lealtek-full.png" alt="LealTEK" className="h-16 object-contain" />
        </a>
        <p className="text-xs text-muted-foreground">
          © {year} Splitout! Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
