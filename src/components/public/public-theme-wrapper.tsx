"use client";

import { useEffect, useRef } from "react";
import { usePublicThemeContext, PublicThemeProvider } from "./public-theme-provider";
import { cn } from "@/lib/utils";

const DARK_CSS_VARS: [string, string][] = [
  ["--background", "#050B14"],
  ["--foreground", "#F8FAFC"],
  ["--card", "#0A192F"],
  ["--card-foreground", "#F8FAFC"],
  ["--popover", "#0A192F"],
  ["--popover-foreground", "#F8FAFC"],
  ["--primary", "#3B82F6"],
  ["--primary-foreground", "#FFFFFF"],
  ["--secondary", "#1E293B"],
  ["--secondary-foreground", "#F1F5F9"],
  ["--muted", "#1E293B"],
  ["--muted-foreground", "#94A3B8"],
  ["--accent", "#1E293B"],
  ["--accent-foreground", "#F1F5F9"],
  ["--border", "#1E293B"],
  ["--input", "#0F203B"],
  ["--ring", "#3B82F6"],
];

const LIGHT_CSS_VARS: [string, string][] = [
  ["--background", "oklch(0.985 0.001 106.423)"],
  ["--foreground", "oklch(0.145 0.012 45.057)"],
  ["--card", "oklch(1 0 0)"],
  ["--card-foreground", "oklch(0.145 0.012 45.057)"],
  ["--popover", "oklch(1 0 0)"],
  ["--popover-foreground", "oklch(0.145 0.012 45.057)"],
  ["--primary", "oklch(0.205 0.1 244.29)"],
  ["--primary-foreground", "oklch(0.985 0.001 106.423)"],
  ["--secondary", "oklch(0.97 0.01 244.29)"],
  ["--secondary-foreground", "oklch(0.205 0.1 244.29)"],
  ["--muted", "oklch(0.97 0.01 106.423)"],
  ["--muted-foreground", "oklch(0.556 0.011 45.187)"],
  ["--accent", "oklch(0.97 0.01 244.29)"],
  ["--accent-foreground", "oklch(0.205 0.1 244.29)"],
  ["--border", "oklch(0.922 0.011 45.187)"],
  ["--input", "oklch(0.922 0.011 45.187)"],
  ["--ring", "oklch(0.205 0.1 244.29)"],
];

/** Inner wrapper that reads from the shared context */
function PublicThemeInner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";
  const divRef = useRef<HTMLDivElement>(null);

  // Apply CSS variables directly onto the element so Shadcn components
  // inside will pick up the right colors (overrides the html.dark cascade)
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const vars = isDark ? DARK_CSS_VARS : LIGHT_CSS_VARS;
    vars.forEach(([k, v]) => el.style.setProperty(k, v));

    if (isDark) {
      el.style.backgroundColor = "#050B14";
      el.style.backgroundImage =
        "radial-gradient(ellipse at top, #0F203B 0%, #050B14 60%, #02060D 100%)";
      el.style.color = "#F8FAFC";
    } else {
      el.style.backgroundColor = "#f8fafc";
      el.style.backgroundImage = "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)";
      el.style.color = "#0f172a";
    }
  }, [isDark]);

  return (
    <div
      ref={divRef}
      className={cn(
        isDark ? "public-dark" : "public-light",
        "public-area min-h-screen",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Public-facing pages wrap their content with this.
 *  It supplies the shared PublicThemeProvider so all children
 *  (Toggle, Search, etc.) share ONE theme state. */
export function PublicThemeWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PublicThemeProvider>
      <PublicThemeInner className={className}>{children}</PublicThemeInner>
    </PublicThemeProvider>
  );
}
