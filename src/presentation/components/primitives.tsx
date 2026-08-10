import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/domain/format";
import { useAuthStore } from "@/store/authStore";
import { clearAccessToken } from "@/services/googleAuth";

export function Logo({ className }: { className?: string | undefined }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
        <span aria-hidden="true" className="text-sm font-black">
          S
        </span>
      </span>
      <span>Splitout!</span>
    </Link>
  );
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

export function AppShell({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {action}
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28">{children}</main>
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
