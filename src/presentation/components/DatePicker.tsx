import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/** Parses a `yyyy-MM-dd` string as a local calendar date (never UTC) — the
 * same approach as `domain/format.ts`'s `formatDate`, so a date like
 * `"2026-08-11"` doesn't shift a day depending on the viewer's timezone. */
function parseIsoDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Popover+Calendar date picker for `Party`/`Expense` dates, replacing the
 * native `<input type="date">`. The native control's calendar glyph is
 * drawn by the browser/OS, ignores the app's dark theme, and its dropdown
 * can't be restyled at all — this renders the app's own themed `Calendar`
 * (shadcn/react-day-picker) inside a `Popover` instead. Value/onChange stay
 * plain ISO `yyyy-MM-dd` strings so callers don't need to know a `Date` is
 * used internally. */
export function DatePicker({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-2xl border border-input bg-card px-4 py-3 text-left font-medium transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            className,
          )}
        >
          <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? format(selected, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
              : "Selecionar data"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-3xl border-border p-0 shadow-pop" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected}
          className="rounded-3xl"
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
