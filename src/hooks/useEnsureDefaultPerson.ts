import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { newPerson } from "@/domain/factories";
import type { Person } from "@/domain/types";
import { useSavePerson } from "./queries";

function seededFlagKey(email: string): string {
  return `splitout:default-person-seeded:${email}`;
}

/** Guarantees the signed-in Google user always has a registered `Person` in
 * the people directory, without requiring manual sign-up. Runs once `people`
 * has loaded: if nobody in the list matches the user's name (case-insensitive,
 * trimmed), it seeds one via `useSavePerson`. A `localStorage` flag (keyed by
 * email) makes the seed idempotent — it fires at most once per account, so a
 * person the user deliberately deletes afterwards is never recreated. */
export function useEnsureDefaultPerson(people: Person[], peopleLoaded: boolean): void {
  const user = useAuthStore((s) => s.user);
  const savePerson = useSavePerson();

  useEffect(() => {
    if (!user || !peopleLoaded) return;
    const flagKey = seededFlagKey(user.email);
    if (localStorage.getItem(flagKey)) return;

    const alreadyRegistered = people.some(
      (p) => p.name.trim().toLowerCase() === user.name.trim().toLowerCase(),
    );
    if (alreadyRegistered) {
      localStorage.setItem(flagKey, "1");
      return;
    }

    localStorage.setItem(flagKey, "1");
    savePerson.mutate(newPerson(user.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savePerson (a mutation object) is recreated every render and must not retrigger this effect.
  }, [user, peopleLoaded, people]);
}
