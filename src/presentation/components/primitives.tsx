import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/domain/format";
import { useAuthStore } from "@/store/authStore";
import { clearAccessToken } from "@/services/googleAuth";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";
import { Footer } from "@/presentation/components/Footer";
import { Logo } from "@/presentation/components/Logo";

export { Logo };

/**
 * Whether the footer is close enough to the viewport that a mobile FAB
 * (fixed to the viewport bottom) would overlap it. Fed by an
 * IntersectionObserver on a sentinel placed right before the footer in
 * `AppShell`, and read by `fabPositionClassName` to dock the FAB above the
 * footer instead of floating over it.
 */
const FooterProximityContext = createContext(false);

/**
 * Returns the position classes for a mobile floating action button: pinned
 * to the viewport (`fixed`) during normal scrolling, switching to `absolute`
 * — anchored to the bottom-right of `AppShell`'s `<main>`, right above the
 * footer — once the footer comes near. `hiddenFrom` mirrors the breakpoint
 * at which the FAB is replaced by an inline button elsewhere in the header.
 */
export function fabPositionClassName(dockAboveFooter: boolean, hiddenFrom: "sm" | "lg") {
  return cn(
    dockAboveFooter ? "absolute" : "fixed",
    "right-5 bottom-6 z-30",
    hiddenFrom === "sm" ? "sm:hidden" : "lg:hidden",
  );
}

export function useFooterProximity() {
  return useContext(FooterProximityContext);
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  if (!user) return null;

  const signOut = () => {
    clearAccessToken();
    clearUser();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      title={user.email}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
    >
      {user.picture ? (
        <img
          src={user.picture}
          alt=""
          className="size-5 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <LogOut aria-hidden="true" className="size-3.5" />
      )}
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}

function PeopleLink() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Link
      to="/pessoas"
      title="Pessoas"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
    >
      <Users aria-hidden="true" className="size-3.5" />
      <span className="hidden sm:inline">Pessoas</span>
    </Link>
  );
}

export function AppShell({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode | undefined;
}) {
  const footerSentinelRef = useRef<HTMLDivElement>(null);
  const [footerNear, setFooterNear] = useState(false);

  useEffect(() => {
    const sentinel = footerSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) =>
      setFooterNear(entry?.isIntersecting ?? false),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {action}
            <PeopleLink />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28">
        <FooterProximityContext.Provider value={footerNear}>
          {children}
        </FooterProximityContext.Provider>
      </main>
      <div ref={footerSentinelRef} aria-hidden="true" />
      <Footer />
    </div>
  );
}

export function Money({
  cents,
  tone = "neutral",
  size = "md",
  signed = false,
  className,
}: {
  cents: number;
  tone?: "neutral" | "positive" | "negative" | "muted" | undefined;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  signed?: boolean | undefined;
  className?: string | undefined;
}) {
  const tones = {
    neutral: "text-foreground",
    positive: "text-positive",
    negative: "text-negative",
    muted: "text-muted-foreground",
  } as const;
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-4xl",
  } as const;
  const prefix = signed ? (cents > 0 ? "+" : cents < 0 ? "−" : "") : "";
  return (
    <span className={cn("money font-bold", tones[tone], sizes[size], className)}>
      {prefix}
      {formatBRL(Math.abs(cents))}
    </span>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true" className="text-4xl">
        {emoji}
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode | undefined;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
        {children}
      </h2>
      {aside}
    </div>
  );
}
