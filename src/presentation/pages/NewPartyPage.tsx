import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { AppShell } from "@/presentation/components/primitives";
import { DatePicker } from "@/presentation/components/DatePicker";
import { IconPicker } from "@/presentation/components/IconPicker";
import { DEFAULT_PARTY_ICON_KEY } from "@/presentation/icons/registry";
import { useCreateParty } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const SUGGESTIONS = ["Shopping", "Sexta no bar", "Churrasco", "Jantar", "Cinema", "Viagem"];

export function NewPartyPage() {
  useDocumentTitle("Novo rolê — Splitout!");
  const navigate = useNavigate();
  const createParty = useCreateParty();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_PARTY_ICON_KEY);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const party = await createParty.mutateAsync({ name: name.trim(), emoji, date });
    void navigate(`/role/${party.id}`);
  };

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Voltar
      </Link>

      <form onSubmit={submit} className="mx-auto max-w-lg space-y-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Qual é o rolê?</h1>

        <div className="flex gap-2">
          <IconPicker label="Ícone do rolê" value={emoji} onChange={setEmoji} />
          <input
            autoFocus
            aria-label="Nome do rolê"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shopping"
            className="flex-1 rounded-2xl border border-input bg-card px-4 py-4 text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground/20"
            >
              {s}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="date" className="mb-2 block text-sm font-semibold">
            Data
          </label>
          <DatePicker id="date" value={date} onChange={setDate} />
        </div>

        {createParty.isError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(createParty.error as Error).message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!name.trim() || createParty.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {createParty.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <>
              Continuar <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
      </form>
    </AppShell>
  );
}
