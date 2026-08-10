import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/store/themeStore";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEME_COLOR_LIGHT = "#faf8f2";
const THEME_COLOR_DARK = "#181a20";

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
  }
  return theme;
}

function applyResolvedTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
}

/** Resolves the active theme (persisted preference + OS setting), applies the
 *  `.dark` class to `<html>` and keeps it in sync with live OS theme changes
 *  while `theme === "system"`. Call once near the app root — the effect is
 *  global because it targets `document.documentElement`, not a subtree. */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    applyResolvedTheme(resolveTheme(theme));
    if (theme !== "system") return;

    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const onChange = () => applyResolvedTheme(resolveTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolvedTheme: resolveTheme(theme), setTheme };
}
