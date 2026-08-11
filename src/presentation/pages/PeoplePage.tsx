import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { PeopleSearch } from "@icon-park/react";
import { AppShell, EmptyState, SectionTitle } from "@/presentation/components/primitives";
import { ParticipantAvatar } from "@/presentation/components/ParticipantAvatar";
import { PersonEditor } from "@/presentation/components/PersonEditor";
import { usePeople, useSavePerson, useDeletePerson } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useEnsureDefaultPerson } from "@/hooks/useEnsureDefaultPerson";
import type { Person } from "@/domain/types";

export function PeoplePage() {
  useDocumentTitle("Pessoas — Splitout!");
  const { data: people = [], isLoading } = usePeople();
  const savePerson = useSavePerson();
  const deletePerson = useDeletePerson();
  const [editing, setEditing] = useState<Person | null | undefined>(undefined);
  useEnsureDefaultPerson(people, !isLoading);

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Seus rolês
      </Link>

      <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Pessoas</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre quem participa quase sempre — dá pra adicionar direto no rolê depois.
            </p>
          </div>
        </header>

        <SectionTitle
          aside={
            <button
              type="button"
              title="Nova pessoa"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Nova pessoa</span>
            </button>
          }
        >
          Cadastradas
        </SectionTitle>

        {isLoading ? (
          <div className="h-24 animate-pulse rounded-3xl bg-muted" />
        ) : people.length === 0 ? (
          <EmptyState
            icon={<PeopleSearch theme="multi-color" size={40} />}
            title="Ninguém cadastrado ainda"
            description="Cadastre as pessoas que mais participam dos seus rolês."
            action={
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                <Plus aria-hidden="true" className="size-4" /> Nova pessoa
              </button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {people.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => setEditing(person)}
                  className="card-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                >
                  <ParticipantAvatar id={person.id} name={person.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{person.name}</p>
                    {person.phone ? (
                      <p className="text-xs text-muted-foreground">{person.phone}</p>
                    ) : null}
                  </div>
                  <Pencil aria-hidden="true" className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PersonEditor
        open={editing !== undefined}
        person={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSave={(person) => {
          savePerson.mutate(person);
          setEditing(undefined);
        }}
        onDelete={(id) => {
          deletePerson.mutate(id);
          setEditing(undefined);
        }}
      />
    </AppShell>
  );
}
