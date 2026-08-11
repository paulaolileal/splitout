import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { usePeople } from "@/hooks/queries";
import { newParticipant, participantFromPerson } from "@/domain/factories";
import type { Participant } from "@/domain/types";
import { ParticipantAvatar } from "./ParticipantAvatar";

/** Adds a participant to a party either by picking someone from the
 * registered-people directory (copies name/phone as a snapshot — see
 * `participantFromPerson`) or by typing a brand-new ad-hoc name, same as
 * before this directory existed. */
export function PeoplePicker({
  existingNames,
  onPick,
}: {
  existingNames: string[];
  onPick: (participant: Participant) => void;
}) {
  const { data: people = [] } = usePeople();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedExisting = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  const available = people.filter((p) => !normalizedExisting.has(p.name.trim().toLowerCase()));
  const trimmedQuery = query.trim();
  const matches = available.filter((p) =>
    p.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
  );
  const hasExactMatch = available.some(
    (p) => p.name.trim().toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const pick = (participant: Participant) => {
    onPick(participant);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Adicionar pessoa"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus aria-hidden="true" className="size-4" /> Adicionar pessoa
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Nome da pessoa…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>
              {trimmedQuery ? "Nenhuma pessoa encontrada." : "Digite um nome para começar."}
            </CommandEmpty>
            {matches.length > 0 ? (
              <CommandGroup heading="Cadastradas">
                {matches.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={person.id}
                    onSelect={() => pick(participantFromPerson(person))}
                  >
                    <ParticipantAvatar name={person.name} size="sm" />
                    <span className="truncate">{person.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {trimmedQuery && !hasExactMatch ? (
              <CommandGroup heading="Nova pessoa">
                <CommandItem
                  value={`new-${trimmedQuery}`}
                  onSelect={() => pick(newParticipant(trimmedQuery))}
                >
                  <UserPlus aria-hidden="true" className="size-4" />
                  <span className="truncate">Adicionar &ldquo;{trimmedQuery}&rdquo; avulsa</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
          <div className="border-t border-border p-2 text-center">
            <Link
              to="/pessoas"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Gerenciar cadastro de pessoas →
            </Link>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
