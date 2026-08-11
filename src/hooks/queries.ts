import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getSheetProvider } from "@/application/repositoryProvider";
import { createPartyObject } from "@/domain/factories";
import type { Party, Person } from "@/domain/types";

export const qk = {
  parties: ["parties"] as const,
  people: ["people"] as const,
};

/** Replaces one party inside the `qk.parties` cache entry — the single
 * source of truth every party read (list or detail) derives from, see
 * `useParty`. Keeps the "update this id within the cached array" logic in
 * one place instead of duplicating it across every optimistic write below. */
function setPartyInCache(queryClient: QueryClient, next: Party) {
  queryClient.setQueryData<Party[]>(qk.parties, (all) =>
    (all ?? []).map((p) => (p.id === next.id ? next : p)),
  );
}

function fetchParties() {
  return getSheetProvider().listParties();
}

export function useParties() {
  return useQuery({
    queryKey: qk.parties,
    queryFn: fetchParties,
  });
}

/** Reactive single party plus an `update(mutate)` helper that optimistically
 * writes the draft to the cache and persists it to the Sheet in the background.
 *
 * Deliberately reads the *same* `qk.parties` query as `useParties()` (via
 * `select`) instead of its own `["parties", id]` entry: a party detail read
 * is a `readAllRows()` over the exact same six sheet tabs as the list read,
 * so giving it a separate cache key just means every rolê the user opens in
 * a session pays for a fresh full read. Sharing the key means the first read
 * of the session (whichever query fires first) serves every other party the
 * user opens afterwards, within `staleTime`. */
export function useParty(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: qk.parties,
    queryFn: fetchParties,
    enabled: !!id,
    select: (parties) => parties.find((p) => p.id === id) ?? null,
  });

  const saveMutation = useMutation({
    mutationFn: (party: Party) => getSheetProvider().saveParty(party),
    onSuccess: (_result, party) => {
      setPartyInCache(queryClient, party);
    },
  });

  function update(mutate: (draft: Party) => Party) {
    const current = query.data;
    if (!current) return;
    const next = mutate(structuredClone(current));
    setPartyInCache(queryClient, next);
    saveMutation.mutate(next);
  }

  return {
    party: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    update,
  };
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, emoji, date }: { name: string; emoji: string; date: string }) => {
      const party = createPartyObject(name, emoji, date);
      await getSheetProvider().saveParty(party);
      return party;
    },
    onSuccess: (party) => {
      // Seed the cache with the party we just wrote instead of letting the
      // next page do a fresh network read — that read can race the write
      // that just happened and briefly (and wrongly) resolve to `null`. Still
      // invalidate afterwards: if this is the first `qk.parties` read of the
      // session (e.g. landed directly on /role/novo), the seeded list would
      // otherwise contain only this one party until the cache naturally goes
      // stale — invalidating fixes that in the background, with no loading
      // flicker on the party page we're about to land on (it already has
      // the seeded data to show while that refetch happens).
      queryClient.setQueryData<Party[]>(qk.parties, (all) => [party, ...(all ?? [])]);
      void queryClient.invalidateQueries({ queryKey: qk.parties });
    },
  });
}

export function useDeleteParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getSheetProvider().deleteParty(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.parties });
    },
  });
}

/** The registered-people directory — party-independent, reusable across
 * every rolê (see `PersonRepository`). */
export function usePeople() {
  return useQuery({
    queryKey: qk.people,
    queryFn: () => getSheetProvider().listPeople(),
  });
}

export function useSavePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (person: Person) => getSheetProvider().savePerson(person),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.people });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getSheetProvider().deletePerson(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.people });
    },
  });
}
