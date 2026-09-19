import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * LESSON: Theming with three states, not two
 *
 * A toggle that only knows "light" and "dark" is a downgrade for users who set
 * a preference at the OS level. So we store a *preference* of three values and
 * derive the *resolved* theme from it:
 *
 *   preference          resolved
 *   ----------          --------
 *   "light"        ->   "light"
 *   "dark"         ->   "dark"
 *   "system"       ->   whatever the OS says, live
 *
 * Only the resolved theme ever touches the DOM (as the `.dark` class on <html>,
 * which is what Tailwind's `dark:` variant and our `.dark { ... }` token block
 * key off of).
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Shared with the inline anti-flash script in index.html. Keep in sync. */
export const THEME_STORAGE_KEY = "ui-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  /** What the user chose: "light" | "dark" | "system". */
  theme: ThemePreference;
  /** What is actually painted right now: "light" | "dark". */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** Flips between light and dark, leaving "system" behind. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode / storage disabled - fall through to the default.
  }
  return "system";
}

interface Props {
  children: ReactNode;
  /** Used when the user has never chosen. Defaults to following the OS. */
  defaultTheme?: ThemePreference;
}

export function ThemeProvider({ children, defaultTheme = "system" }: Props) {
  // Lazy initialiser: reads localStorage once, on mount, instead of on every
  // render. The inline script in index.html has already applied the class, so
  // this is only about getting React's state in sync with the DOM.
  const [theme, setThemeState] = useState<ThemePreference>(
    () => readStoredTheme() ?? defaultTheme,
  );
  const [systemPref, setSystemPref] = useState<ResolvedTheme>(systemTheme);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemPref : theme;

  // Keep following the OS while the preference is "system". Without this, a
  // user who flips their laptop to dark mode at sunset sees nothing change.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemPref(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isFirstApply = useRef(true);

  // The single place in the whole app that writes to the DOM for theming.
  useEffect(() => {
    const root = document.documentElement;

    // Skip the cross-fade on the very first paint - otherwise the app appears
    // to "fade in" from the wrong theme on every hard reload.
    if (isFirstApply.current) {
      isFirstApply.current = false;
    } else {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 220);
    }

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not fatal: the theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  // Memoised so consumers don't re-render just because the provider did.
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
