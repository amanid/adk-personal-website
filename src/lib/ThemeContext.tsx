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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(defaultThemeId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
    setMounted(true);
  }, []);

  const setTheme = (id: string) => {
    setThemeState(id);
    localStorage.setItem("theme", id);
    document.documentElement.setAttribute("data-theme", id);
  };

  // Prevent flash: apply theme attribute immediately on mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
