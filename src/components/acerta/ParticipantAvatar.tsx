import { cn } from "@/lib/utils";
import { colorFor, initials } from "@/lib/acerta/format";

export function ParticipantAvatar({
  name,
  id,
  size = "md",
  className,
}: {
  name: string;
  id?: string | undefined;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  className?: string | undefined;
}) {
  const sizes = {
    sm: "size-7 text-[11px]",
    md: "size-9 text-xs",
    lg: "size-12 text-sm",
    xl: "size-16 text-lg",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-card",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: colorFor(id ?? name) }}
    >
      {initials(name)}
    </span>
  );
}

export function ParticipantChip({
  name,
  id,
  selected,
  onClick,
  onRemove,
}: {
  name: string;
  id?: string | undefined;
  selected?: boolean | undefined;
  onClick?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
}) {
  const content = (
    <>
      <ParticipantAvatar name={name} id={id} size="sm" />
      <span className="truncate">{name}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition-all",
          selected
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border bg-card text-muted-foreground hover:border-foreground/20",
        )}
      >
        {content}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2 pl-1 text-sm font-medium">
      {content}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${name}`}
          className="ml-1 rounded-full px-1.5 text-muted-foreground hover:text-destructive"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}