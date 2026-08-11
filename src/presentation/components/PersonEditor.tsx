import { useState } from "react";
import { Caution } from "@icon-park/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { newPerson } from "@/domain/factories";
import { isValidPhone, maskPhoneInput, toLocalPhoneDigits } from "@/domain/format";
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
  // Stored as plain digits (DDD + number, no punctuation) — `maskPhoneInput`
  // formats them for display only, it never becomes the state itself.
  const [phone, setPhone] = useState(toLocalPhoneDigits(person?.phone ?? ""));
  const [pixKey, setPixKey] = useState(person?.pixKey ?? "");
  const [touched, setTouched] = useState(false);

  // Reset the draft whenever a different person (or "new") is opened.
  const key = person?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setName(person?.name ?? "");
    setPhone(toLocalPhoneDigits(person?.phone ?? ""));
    setPixKey(person?.pixKey ?? "");
    setTouched(false);
  }

  const nameError = !name.trim() ? "Dê um nome para a pessoa." : null;
  const phoneError = phone && !isValidPhone(phone) ? "Telefone inválido. Inclua o DDD." : null;
  const error = nameError ?? phoneError;

  const save = () => {
    setTouched(true);
    if (error) return;
    const base = person ?? newPerson(name);
    const trimmedPixKey = pixKey.trim();
    onSave({
      ...base,
      name: name.trim(),
      ...(phone ? { phone } : {}),
      ...(trimmedPixKey ? { pixKey: trimmedPixKey } : {}),
      updatedAt: Date.now(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-1.5rem)] max-w-sm flex-col rounded-3xl p-0 sm:max-w-sm">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-extrabold">
            {person ? "Editar pessoa" : "Nova pessoa"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
              value={maskPhoneInput(phone)}
              onChange={(e) => setPhone(toLocalPhoneDigits(e.target.value))}
              placeholder="(31) 99999-9999"
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Chave PIX (opcional)</p>
            <input
              aria-label="Chave PIX"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>
          {touched && error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Caution theme="multi-color" size={16} /> {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-card px-5 py-4">
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
