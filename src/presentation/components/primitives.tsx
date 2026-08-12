import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Monitor, Moon, Sun, User as UserIcon, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/domain/format";
import { useAuthStore } from "@/store/authStore";
import { signOut as signOutOfGoogle } from "@/services/googleAuth";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/store/themeStore";
import { Footer } from "@/presentation/components/Footer";
import { Logo } from "@/presentation/components/Logo";

export { Logo };

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Automático", icon: Monitor },
];

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const { theme, setTheme } = useTheme();
  if (!user) return null;

  const ActiveThemeIcon = THEME_OPTIONS.find((o) => o.value === theme)?.icon ?? Monitor;

  const signOut = () => {
    signOutOfGoogle();
    clearUser();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={user.email}
          aria-label="Menu do usuário"
          className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full border border-border text-muted-foreground hover:text-foreground"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt=""
              className="size-full rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon aria-hidden="true" className="size-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <ActiveThemeIcon aria-hidden="true" className="size-4" />
            Tema
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuRadioItem key={value} value={value} className="gap-2 pl-8">
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="gap-2 text-negative focus:bg-negative/10 focus:text-negative"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {action}
            <PeopleLink />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-6">{children}</main>
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
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true">{icon}</span>
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
