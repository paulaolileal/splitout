import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSheetProvider } from "@/application/repositoryProvider";
import { createPartyObject } from "@/domain/factories";
import type { Party } from "@/domain/types";

export const qk = {
  parties: ["parties"] as const,
  party: (id: string) => ["parties", id] as const,
};

export function useParties() {
  return useQuery({
    queryKey: qk.parties,
    queryFn: () => getSheetProvider().listParties(),
  });
}

/** Reactive single party plus an `update(mutate)` helper that optimistically
 * writes the draft to the cache and persists it to the Sheet in the background. */
export function useParty(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: qk.party(id),
    queryFn: () => getSheetProvider().getParty(id),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (party: Party) => getSheetProvider().saveParty(party),
    onSuccess: (_result, party) => {
      queryClient.setQueryData(qk.party(id), party);
      void queryClient.invalidateQueries({ queryKey: qk.parties });
    },
  });

  function update(mutate: (draft: Party) => Party) {
    const current = query.data;
    if (!current) return;
    const next = mutate(structuredClone(current));
    queryClient.setQueryData(qk.party(id), next);
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
      // that just happened and briefly (and wrongly) resolve to `null`.
      queryClient.setQueryData(qk.party(party.id), party);
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
