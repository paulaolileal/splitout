import { useMemo, useState } from "react";
import { Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatCents, parseAmount } from "@/lib/acerta/format";
import { splitTotal } from "@/lib/acerta/engine";
import type { Expense, Participant, SplitType } from "@/lib/acerta/types";
import { uid } from "@/lib/acerta/store";
import { ParticipantAvatar, ParticipantChip } from "./ParticipantAvatar";

const EMOJIS = ["🧾", "🍝", "🍻", "🚕", "🎬", "🏖️", "🛒", "🥩", "☕", "🎁", "⛽", "🏨"];

const SPLITS: { id: SplitType; label: string; hint: string }[] = [
  { id: "equal", label: "Igual", hint: "Todo mundo paga a mesma coisa" },
  { id: "item", label: "Por item", hint: "Cada um paga o que consumiu" },
  { id: "custom", label: "Personalizado", hint: "Você define valor por pessoa" },
  { id: "weight", label: "Proporcional", hint: "Por peso (ex.: noites, pessoas)" },
];

function AmountInput({
  cents,
  onChange,
  label,
  className,
  big,
}: {
  cents: number;
  onChange: (cents: number) => void;
  label: string;
  className?: string | undefined;
  big?: boolean | undefined;
}) {
  const [text, setText] = useState(cents ? formatCents(cents) : "");
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground",
          big && "text-xl",
        )}
      >
        R$
      </span>
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        placeholder="0,00"
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseAmount(e.target.value));
        }}
        onBlur={() => setText(cents ? formatCents(cents) : "")}
        className={cn(
          "money w-full rounded-2xl border border-input bg-card py-3 pr-3 pl-11 font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          big && "py-5 text-3xl",
        )}
      />
    </div>
  );
}

export function ExpenseEditor({
  open,
  expense,
  participants,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  expense: Expense | null;
  participants: Participant[];
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: ((id: string) => void) | undefined;
}) {
  const [draft, setDraft] = useState<Expense | null>(expense);
  const [touched, setTouched] = useState(false);

  // Reset draft whenever a different expense is opened.
  const key = expense?.id ?? "none";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setDraft(expense);
    setTouched(false);
  }

  const patch = (values: Partial<Expense>) =>
    setDraft((current) => (current ? { ...current, ...values } : current));

  const diff = useMemo(() => {
    if (!draft) return 0;
    return draft.totalAmount - splitTotal(draft);
  }, [draft]);

  if (!draft) return null;

  const errors: string[] = [];
  if (!draft.description.trim()) errors.push("Dê um nome para a despesa.");
  if (draft.totalAmount <= 0) errors.push("Informe um valor maior que zero.");
  if (!draft.paidBy) errors.push("Escolha quem pagou.");
  if (draft.splitType === "equal" && draft.sharedWith.length === 0)
    errors.push("Escolha pelo menos uma pessoa na divisão.");
  if (draft.splitType === "weight" && draft.weights.every((w) => w.weight <= 0))
    errors.push("Informe pelo menos um peso.");
  if ((draft.splitType === "item" || draft.splitType === "custom") && diff !== 0)
    errors.push(
      diff > 0
        ? `Faltam ${formatBRL(diff)} para fechar a conta.`
        : `Passou ${formatBRL(-diff)} do valor da despesa.`,
    );
  if (draft.splitType === "item" && draft.items.some((i) => i.participantIds.length === 0))
    errors.push("Cada item precisa de pelo menos uma pessoa.");

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const balanced =
    (draft.splitType === "item" || draft.splitType === "custom") &&
    draft.totalAmount > 0 &&
    diff === 0;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-extrabold">
            {expense?.description ? "Editar despesa" : "Nova despesa"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-5 py-5">
          <div className="flex gap-2">
            <select
              aria-label="Ícone da despesa"
              value={draft.emoji}
              onChange={(e) => patch({ emoji: e.target.value })}
              className="rounded-2xl border border-input bg-card px-3 text-xl"
            >
              {EMOJIS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <input
              aria-label="Descrição da despesa"
              autoFocus
              value={draft.description}
              placeholder="Restaurante, Uber, cinema…"
              onChange={(e) => patch({ description: e.target.value })}
              className="flex-1 rounded-2xl border border-input bg-card px-4 py-3 font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Valor</p>
            <AmountInput
              big
              label="Valor total da despesa"
              cents={draft.totalAmount}
              onChange={(value) => patch({ totalAmount: value })}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Quem pagou?</p>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <ParticipantChip
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  selected={draft.paidBy === p.id}
                  onClick={() => patch({ paidBy: p.id })}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Como dividir?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPLITS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    patch({
                      splitType: s.id,
                      weights:
                        s.id === "weight" && draft.weights.length === 0
                          ? participants.map((p) => ({ participantId: p.id, weight: 1 }))
                          : draft.weights,
                      allocations:
                        s.id === "custom" && draft.allocations.length === 0
                          ? participants.map((p) => ({ participantId: p.id, amount: 0 }))
                          : draft.allocations,
                    })
                  }
                  aria-pressed={draft.splitType === s.id}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors",
                    draft.splitType === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-foreground/20",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {SPLITS.find((s) => s.id === draft.splitType)?.hint}
            </p>
          </div>

          {draft.splitType === "equal" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Dividido entre</p>
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <ParticipantChip
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    selected={draft.sharedWith.includes(p.id)}
                    onClick={() => patch({ sharedWith: toggle(draft.sharedWith, p.id) })}
                  />
                ))}
              </div>
              {draft.sharedWith.length > 0 && draft.totalAmount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {formatBRL(Math.round(draft.totalAmount / draft.sharedWith.length))} para cada
                </p>
              ) : null}
            </div>
          ) : null}

          {draft.splitType === "item" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Itens</p>
              {draft.items.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-border bg-muted/40 p-3">
                  <div className="flex gap-2">
                    <input
                      aria-label={`Descrição do item ${index + 1}`}
                      value={item.description}
                      placeholder="Macarrão"
                      onChange={(e) =>
                        patch({
                          items: draft.items.map((i) =>
                            i.id === item.id ? { ...i, description: e.target.value } : i,
                          ),
                        })
                      }
                      className="flex-1 rounded-xl border border-input bg-card px-3 py-2 text-sm"
                    />
                    <AmountInput
                      label={`Valor do item ${index + 1}`}
                      className="w-32"
                      cents={item.amount}
                      onChange={(value) =>
                        patch({
                          items: draft.items.map((i) =>
                            i.id === item.id ? { ...i, amount: value } : i,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remover item ${index + 1}`}
                      onClick={() =>
                        patch({ items: draft.items.filter((i) => i.id !== item.id) })
                      }
                      className="rounded-xl px-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {participants.map((p) => (
                      <ParticipantChip
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        selected={item.participantIds.includes(p.id)}
                        onClick={() =>
                          patch({
                            items: draft.items.map((i) =>
                              i.id === item.id
                                ? { ...i, participantIds: toggle(i.participantIds, p.id) }
                                : i,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patch({
                    items: [
                      ...draft.items,
                      { id: uid(), description: "", amount: 0, participantIds: [] },
                    ],
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-2 text-sm font-semibold"
              >
                <Plus aria-hidden="true" className="size-4" /> Adicionar item
              </button>
            </div>
          ) : null}

          {draft.splitType === "custom" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Quanto cada um assume</p>
              {participants.map((p) => {
                const value =
                  draft.allocations.find((a) => a.participantId === p.id)?.amount ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <ParticipantAvatar id={p.id} name={p.name} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    <AmountInput
                      label={`Valor de ${p.name}`}
                      className="w-36"
                      cents={value}
                      onChange={(amount) =>
                        patch({
                          allocations: [
                            ...draft.allocations.filter((a) => a.participantId !== p.id),
                            { participantId: p.id, amount },
                          ],
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          {draft.splitType === "weight" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Peso de cada pessoa</p>
              {participants.map((p) => {
                const value = draft.weights.find((w) => w.participantId === p.id)?.weight ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <ParticipantAvatar id={p.id} name={p.name} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    <input
                      aria-label={`Peso de ${p.name}`}
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) =>
                        patch({
                          weights: [
                            ...draft.weights.filter((w) => w.participantId !== p.id),
                            {
                              participantId: p.id,
                              weight: Math.max(0, Number(e.target.value) || 0),
                            },
                          ],
                        })
                      }
                      className="money w-24 rounded-2xl border border-input bg-card px-3 py-2 text-right font-bold"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          {draft.splitType === "item" || draft.splitType === "custom" ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
                balanced ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative",
              )}
            >
              {balanced ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <AlertTriangle aria-hidden="true" className="size-4" />
              )}
              <span className="money">
                {formatBRL(splitTotal(draft))} / {formatBRL(draft.totalAmount)}
              </span>
              {!balanced && diff !== 0 ? (
                <span className="ml-auto font-medium">
                  {diff > 0 ? `faltam ${formatBRL(diff)}` : `passou ${formatBRL(-diff)}`}
                </span>
              ) : null}
            </div>
          ) : null}

          {touched && errors.length > 0 ? (
            <ul className="space-y-1 text-sm text-destructive">
              {errors.map((error) => (
                <li key={error}>⚠️ {error}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-5 py-4">
          {onDelete && expense ? (
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-destructive"
            >
              Excluir
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setTouched(true);
              if (errors.length === 0) onSave(draft);
            }}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98]"
          >
            Salvar despesa
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}