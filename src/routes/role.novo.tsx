import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/acerta/primitives";
import { createParty } from "@/lib/acerta/store";

export const Route = createFileRoute("/role/novo")({
  head: () => ({
    meta: [
      { title: "Novo rolê — Acerta" },
      { name: "description", content: "Crie um rolê em segundos e comece a dividir as contas." },
      { property: "og:title", content: "Novo rolê — Acerta" },
      {
        property: "og:description",
        content: "Crie um rolê em segundos e comece a dividir as contas.",
      },
    ],
  }),
  component: NewParty,
});

const EMOJIS = ["🍝", "🍻", "🏖️", "🎬", "🥩", "🛒", "🚕", "☕", "🎉", "🏨"];
const SUGGESTIONS = ["Shopping", "Sexta no bar", "Churrasco", "Jantar", "Cinema", "Viagem"];

function NewParty() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍝");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const party = createParty(name.trim(), emoji, date);
    void navigate({ to: "/role/$id", params: { id: party.id } });
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
          <select
            aria-label="Ícone do rolê"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="rounded-2xl border border-input bg-card px-3 text-2xl"
          >
            {EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
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
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          Continuar <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </form>
    </AppShell>
  );
}