"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type PublicTheme = "light" | "dark";

interface PublicThemeContextValue {
  theme: PublicTheme;
  toggleTheme: () => void;
}

const PublicThemeContext = createContext<PublicThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function PublicThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<PublicTheme>("dark");

  // Read from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as PublicTheme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  // Apply background to body whenever theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.body.style.setProperty("background-color", "#050B14", "important");
      document.body.style.setProperty(
        "background-image",
        "radial-gradient(ellipse at top, #0F203B 0%, #050B14 60%, #02060D 100%)",
        "important"
      );
      document.body.style.removeProperty("color");
    } else {
      document.body.style.setProperty("background-color", "#f8fafc", "important");
      document.body.style.setProperty(
        "background-image",
        "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
        "important"
      );
      document.body.style.setProperty("color", "#0f172a", "important");
    }

    return () => {
      // Only cleanup when the provider unmounts (navigating away from public pages)
      document.body.style.removeProperty("background-color");
      document.body.style.removeProperty("background-image");
      document.body.style.removeProperty("color");
    };
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  }, []);

  return (
    <PublicThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicThemeContext() {
  return useContext(PublicThemeContext);
}
