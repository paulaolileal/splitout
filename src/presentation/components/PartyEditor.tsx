import { useState } from "react";
import { Caution } from "@icon-park/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/presentation/components/DatePicker";
import { IconPicker } from "@/presentation/components/IconPicker";
import type { Party } from "@/domain/types";

export interface PartyEditorValues {
  name: string;
  emoji: string;
  date: string;
}

/** Dialog to edit a rolê's name/icon/date after creation — modeled on
 * `PersonEditor.tsx`, the simplest existing editor in the app (unlike
 * `ExpenseEditor`, there's no split logic here). Deleting the whole rolê
 * already lives elsewhere (the "Excluir" action in `PartyPage`'s
 * `AppShell`), so this dialog only ever saves. */
export function PartyEditor({
  open,
  party,
  onClose,
  onSave,
}: {
  open: boolean;
  party: Party | null;
  onClose: () => void;
  onSave: (values: PartyEditorValues) => void;
}) {
  const [name, setName] = useState(party?.name ?? "");
  const [emoji, setEmoji] = useState(party?.emoji ?? "");
  const [date, setDate] = useState(party?.date ?? "");
  const [touched, setTouched] = useState(false);

  // Reset the draft whenever a different party (or a fresh dialog open) comes in.
  const key = party?.id ?? "none";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setName(party?.name ?? "");
    setEmoji(party?.emoji ?? "");
    setDate(party?.date ?? "");
    setTouched(false);
  }

  const error = !name.trim() ? "Dê um nome para o rolê." : null;

  const save = () => {
    setTouched(true);
    if (error) return;
    onSave({ name: name.trim(), emoji, date });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-1.5rem)] max-w-sm flex-col rounded-3xl p-0 sm:max-w-sm">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-extrabold">Editar rolê</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold">Nome</p>
            <div className="flex gap-2">
              <IconPicker label="Ícone do rolê" value={emoji} onChange={setEmoji} />
              <input
                aria-label="Nome do rolê"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shopping"
                className="flex-1 rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="party-editor-date" className="mb-2 block text-sm font-semibold">
              Data
            </label>
            <DatePicker
              id="party-editor-date"
              value={date}
              onChange={setDate}
              className="py-2.5 text-sm"
            />
          </div>
          {touched && error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Caution theme="multi-color" size={16} /> {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-card px-5 py-4">
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98]"
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
