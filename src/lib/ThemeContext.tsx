"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { defaultThemeId } from "./themes";

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemeId,
  setTheme: () => {},
});

const LIGHT_THEMES = new Set(["light-professional"]);

/** Same rules as the inline script in layout.tsx, applied on a live switch. */
function applyTheme(id: string) {
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  const light = LIGHT_THEMES.has(id);
  root.classList.toggle("dark", !light);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", light ? "#f6f4ef" : "#0f0f0e");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(defaultThemeId);

  // One-time theme hydration from localStorage on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setTheme = (id: string) => {
    setThemeState(id);
    localStorage.setItem("theme", id);
    applyTheme(id);
  };

  // Always render the Provider: swapping element types after mount would
  // remount the whole app. The inline script in layout.tsx already applies the
  // stored theme before paint, so there is no flash to guard against.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
