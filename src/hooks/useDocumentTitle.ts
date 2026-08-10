import { useEffect } from "react";

/** Sets `document.title` for the lifetime of the calling page, restoring the
 * previous title on unmount. Replaces the per-route `head()` meta the old
 * TanStack Router setup provided — React Router v7 has no built-in equivalent
 * and the app doesn't need a full head-management library for it. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
