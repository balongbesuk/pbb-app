"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type PublicTheme = "light" | "dark";

interface PublicThemeContextValue {
  theme: PublicTheme;
  toggleTheme: () => void;
}

const PublicThemeContext = createContext<PublicThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function PublicThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<PublicTheme>("light");

  // Read from localStorage or system preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as PublicTheme | null;
    
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      // If no saved theme, check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Apply background to body + CSS vars to html element whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Save original dark class state from next-themes so we can restore on cleanup
    const hadDarkClass = root.classList.contains("dark");

    // Force the html element's dark class to match our public theme
    // This overrides next-themes' system preference detection
    if (theme === "dark") {
      root.classList.add("dark");
      // CSS variables for dark - set on html element to override .dark class vars
      root.style.setProperty("--background", "#050B14");
      root.style.setProperty("--foreground", "#F8FAFC");
      root.style.setProperty("--card", "#0A192F");
      root.style.setProperty("--card-foreground", "#F8FAFC");
      root.style.setProperty("--popover", "#0A192F");
      root.style.setProperty("--popover-foreground", "#F8FAFC");
      root.style.setProperty("--primary", "#3B82F6");
      root.style.setProperty("--primary-foreground", "#FFFFFF");
      root.style.setProperty("--secondary", "#1E293B");
      root.style.setProperty("--secondary-foreground", "#F1F5F9");
      root.style.setProperty("--muted", "#1E293B");
      root.style.setProperty("--muted-foreground", "#94A3B8");
      root.style.setProperty("--accent", "#1E293B");
      root.style.setProperty("--accent-foreground", "#F1F5F9");
      root.style.setProperty("--border", "#1E293B");
      root.style.setProperty("--input", "#0F203B");
      root.style.setProperty("--ring", "#3B82F6");
      body.style.setProperty("background-color", "#050B14", "important");
      body.style.setProperty("background-image", "radial-gradient(ellipse at top, #0F203B 0%, #050B14 60%, #02060D 100%)", "important");
      body.style.removeProperty("color");
    } else {
      root.classList.remove("dark");
      // CSS variables for light - override back to light values on html element
      root.style.setProperty("--background", "#f8fafc");
      root.style.setProperty("--foreground", "#0f172a");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#0f172a");
      root.style.setProperty("--popover", "#ffffff");
      root.style.setProperty("--popover-foreground", "#0f172a");
      root.style.setProperty("--primary", "#1d4ed8");
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--secondary", "#f1f5f9");
      root.style.setProperty("--secondary-foreground", "#0f172a");
      root.style.setProperty("--muted", "#f1f5f9");
      root.style.setProperty("--muted-foreground", "#64748b");
      root.style.setProperty("--accent", "#f1f5f9");
      root.style.setProperty("--accent-foreground", "#0f172a");
      root.style.setProperty("--border", "#e2e8f0");
      root.style.setProperty("--input", "#e2e8f0");
      root.style.setProperty("--ring", "#1d4ed8");
      body.style.setProperty("background-color", "#f8fafc", "important");
      body.style.setProperty("background-image", "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)", "important");
      body.style.setProperty("color", "#0f172a", "important");
    }

    return () => {
      // Cleanup CSS variable overrides when navigating away from public pages
      const vars = ["--background","--foreground","--card","--card-foreground",
        "--popover","--popover-foreground","--primary","--primary-foreground",
        "--secondary","--secondary-foreground","--muted","--muted-foreground",
        "--accent","--accent-foreground","--border","--input","--ring"];
      vars.forEach((v) => root.style.removeProperty(v));
      body.style.removeProperty("background-color");
      body.style.removeProperty("background-image");
      body.style.removeProperty("color");
      // Restore original dark class state for next-themes
      if (hadDarkClass) root.classList.add("dark");
      else root.classList.remove("dark");
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
