import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ICON_CATEGORIES, resolveIcon } from "@/presentation/icons/registry";

/** Grid item for a single icon option inside the popover. Renders as a
 * `CommandItem` (not a plain button) so cmdk's item count stays accurate —
 * that's what drives `CommandEmpty`'s visibility. */
function IconOptionItem({
  iconKey,
  label,
  selected,
  onSelect,
}: {
  iconKey: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = resolveIcon(iconKey);
  return (
    <CommandItem
      value={iconKey}
      title={label}
      aria-label={label}
      onSelect={onSelect}
      className={cn(
        "size-11 justify-center rounded-xl border p-0",
        selected ? "border-primary bg-primary/10" : "border-transparent",
      )}
    >
      <Icon theme="multi-color" size={24} />
    </CommandItem>
  );
}

/** Popover+search picker for the `@icon-park/react` "multi-color" icons
 * that back `Party.emoji`/`Expense.emoji` — a colorful grid grouped by
 * category (Comida & Bebida / Esporte / Atividades), replacing the old
 * native `<select>` of raw emoji characters (which couldn't render
 * anything but text inside an `<option>`). */
export function IconPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (key: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const SelectedIcon = resolveIcon(value);

  const trimmedQuery = query.trim().toLowerCase();
  const filteredCategories = ICON_CATEGORIES.map((category) => ({
    ...category,
    icons: trimmedQuery
      ? category.icons.filter((icon) => icon.label.toLowerCase().includes(trimmedQuery))
      : category.icons,
  })).filter((category) => category.icons.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="grid size-12 shrink-0 place-items-center rounded-2xl border border-input bg-card"
        >
          <SelectedIcon theme="multi-color" size={26} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar ícone…" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-72">
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            {filteredCategories.map((category) => (
              <CommandGroup
                key={category.label}
                heading={category.label}
                className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-6 [&_[cmdk-group-items]]:gap-1"
              >
                {category.icons.map((icon) => (
                  <IconOptionItem
                    key={icon.key}
                    iconKey={icon.key}
                    label={icon.label}
                    selected={icon.key === value}
                    onSelect={() => {
                      onChange(icon.key);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
