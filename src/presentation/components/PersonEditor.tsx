import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { newPerson } from "@/domain/factories";
import type { Person } from "@/domain/types";

export function PersonEditor({
  open,
  person,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  person: Person | null;
  onClose: () => void;
  onSave: (person: Person) => void;
  onDelete?: ((id: string) => void) | undefined;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [touched, setTouched] = useState(false);

  // Reset the draft whenever a different person (or "new") is opened.
  const key = person?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setName(person?.name ?? "");
    setPhone(person?.phone ?? "");
    setTouched(false);
  }

  const error = !name.trim() ? "Dê um nome para a pessoa." : null;

  const save = () => {
    setTouched(true);
    if (error) return;
    const base = person ?? newPerson(name);
    const trimmedPhone = phone.trim();
    onSave({
      ...base,
      name: name.trim(),
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      updatedAt: Date.now(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-3xl p-0 sm:max-w-sm">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-extrabold">
            {person ? "Editar pessoa" : "Nova pessoa"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold">Nome</p>
            <input
              aria-label="Nome"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da pessoa"
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">WhatsApp (opcional)</p>
            <input
              aria-label="Telefone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 91234-5678"
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>
          {touched && error ? <p className="text-sm text-destructive">⚠️ {error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-5 py-4">
          {onDelete && person ? (
            <button
              type="button"
              onClick={() => onDelete(person.id)}
              className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-destructive"
            >
              Excluir
            </button>
          ) : null}
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
